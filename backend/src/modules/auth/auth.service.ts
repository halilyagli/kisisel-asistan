import { prisma } from '../../core/database/prisma';
import { SecurityUtil } from '../../core/utils/jwt.util';
import { eventBus, SystemEvents } from '../../core/events/event-bus';
import { RegisterInput, LoginInput, UpdateProfileInput, ChangeTierInput } from './auth.schema';

export class AuthService {
  /**
   * Yeni Kullanıcı Kaydı (Multi-Tenant Başlatma ve Varsayılan Veriler)
   */
  public async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new Error('Bu e-posta adresi ile kayıtlı bir hesap zaten bulunmaktadır.');
    }

    const passwordHash = await SecurityUtil.hashPassword(input.password);

    // Kullanıcıyı oluştur
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        fullName: input.fullName,
        passwordHash,
        subscriptionTier: 'FREE',
        subscriptionStatus: 'ACTIVE',
      },
    });

    // Kullanıcıya özel varsayılan Finans Kategorilerini oluştur
    const defaultCategories = [
      { name: 'Maaş / Gelir', type: 'INCOME', icon: 'Briefcase', color: '#10b981' },
      { name: 'Kira / Konut', type: 'EXPENSE', icon: 'Home', color: '#ef4444' },
      { name: 'Faturalar', type: 'EXPENSE', icon: 'Zap', color: '#f59e0b' },
      { name: 'Market & Gıda', type: 'EXPENSE', icon: 'ShoppingCart', color: '#3b82f6' },
      { name: 'Ulaşım & Yakıt', type: 'EXPENSE', icon: 'Car', color: '#8b5cf6' },
      { name: 'Sağlık & Bakım', type: 'EXPENSE', icon: 'Heart', color: '#ec4899' },
      { name: 'Eğlence & Sosyal', type: 'EXPENSE', icon: 'Film', color: '#6366f1' },
      { name: 'Abonelikler', type: 'EXPENSE', icon: 'Repeat', color: '#14b8a6' },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map(cat => ({
        ...cat,
        userId: user.id,
      })),
    });

    // Event fırlat
    eventBus.publish(SystemEvents.USER_REGISTERED, { userId: user.id, email: user.email });

    const tokens = await this.generateUserTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Kullanıcı Girişi
   */
  public async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new Error('E-posta veya şifre hatalı.');
    }

    const isValid = await SecurityUtil.comparePassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error('E-posta veya şifre hatalı.');
    }

    const tokens = await this.generateUserTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Token Yenileme (Refresh Token Rotation)
   */
  public async refreshToken(token: string) {
    try {
      const decoded: any = SecurityUtil.verifyToken(token);
      if (decoded.type !== 'refresh' || !decoded.userId) {
        throw new Error('Geçersiz refresh token.');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('Kullanıcı bulunamadı.');
      }

      const accessToken = SecurityUtil.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
      });

      return { accessToken };
    } catch (err) {
      throw new Error('Oturum süresi dolmuş, lütfen tekrar giriş yapın.');
    }
  }

  /**
   * Profil Bilgisi Getir
   */
  public async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            accounts: true,
            transactions: true,
            installmentPlans: true,
            notes: true,
            calendarEvents: true,
          }
        }
      }
    });

    if (!user) {
      throw new Error('Kullanıcı bulunamadı.');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Profil Güncelle
   */
  public async updateProfile(userId: string, input: UpdateProfileInput) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: input.fullName,
        avatarUrl: input.avatarUrl,
      },
    });

    return this.sanitizeUser(updated);
  }

  /**
   * Abonelik Planı Değiştirme (SaaS Tier Simülasyonu / Entegrasyon Noktası)
   */
  public async changeTier(userId: string, input: ChangeTierInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: input.tier,
        subscriptionStatus: 'ACTIVE',
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
      },
    });

    eventBus.publish(SystemEvents.USER_SUBSCRIPTION_CHANGED, {
      userId,
      newTier: input.tier,
    });

    return this.sanitizeUser(user);
  }

  private async generateUserTokens(user: any) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
    };

    const accessToken = SecurityUtil.generateAccessToken(payload);
    const refreshToken = SecurityUtil.generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

export const authService = new AuthService();
