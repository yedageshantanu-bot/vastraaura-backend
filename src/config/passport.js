const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const User = require("../../models/User");
const { normalizeEmail, resolveRole } = require("../utils/auth");
const { findOrCreateGoogleUser, isDbConnected } = require("../utils/localStore");

const requiredEnv = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
const isPassportConfigured = missingEnv.length === 0;

if (isPassportConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:5001/api/users/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = normalizeEmail(profile.emails?.[0]?.value);
          if (!email) {
            return done(null, false, { message: "Google account email is required" });
          }

          const profileImage = profile.photos?.[0]?.value || "";
          const role = resolveRole(email);

          if (!isDbConnected()) {
            const user = findOrCreateGoogleUser({
              email,
              googleId: profile.id,
              name: profile.displayName || email.split("@")[0],
              profileImage,
            });

            return done(null, user);
          }

          const user = await User.findOneAndUpdate(
            {
              $or: [{ googleId: profile.id }, { email }],
            },
            {
              $set: {
                name: profile.displayName || email.split("@")[0],
                email,
                googleId: profile.id,
                profileImage,
                avatar: profileImage,
                authProvider: "google",
                provider: "google",
                role,
              },
            },
            {
              new: true,
              upsert: true,
              setDefaultsOnInsert: true,
            },
          );

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );
}

module.exports = passport;
module.exports.isPassportConfigured = isPassportConfigured;
module.exports.passportConfigError = isPassportConfigured
  ? null
  : new Error(
      `Missing Google OAuth config: ${missingEnv.join(", ")}`,
    );
