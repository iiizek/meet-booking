import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { config } from '../config/index.js';
import prisma from '../lib/prisma.js';
import { User } from '@prisma/client';

// Расширяем тип Profile для доступа к токенам
interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
}

// Настройка Google OAuth стратегии
export function configurePassport(): void {
  // Сериализация пользователя для сессии (если используется)
  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth 2.0 Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
        scope: [
          'profile',
          'email',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
        ],
        // Запрашиваем refresh token
        accessType: 'offline',
        prompt: 'consent',
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName;
          const avatarUrl = profile.photos?.[0]?.value;
          const googleId = profile.id;

          if (!email) {
            return done(new Error('Email не получен от Google'), undefined);
          }

          // Ищем пользователя по Google ID или email
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { googleId },
                { email },
              ],
            },
          });

          if (user) {
            // Обновляем данные пользователя
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId,
                name: user.name || name,
                avatarUrl: avatarUrl || user.avatarUrl,
                googleAccessToken: accessToken,
                googleRefreshToken: refreshToken || user.googleRefreshToken,
              },
            });
          } else {
            // Создаём нового пользователя
            // По умолчанию без организации - админ должен привязать
            user = await prisma.user.create({
              data: {
                email,
                name,
                googleId,
                avatarUrl,
                googleAccessToken: accessToken,
                googleRefreshToken: refreshToken,
              },
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

export default passport;
