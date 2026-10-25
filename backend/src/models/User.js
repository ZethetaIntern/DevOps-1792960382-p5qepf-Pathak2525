import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const ROLES = ["admin", "cto", "sre", "dba", "security", "risk", "viewer"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "viewer", index: true },
    active: { type: Boolean, default: true },
    failedLogins: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (plain) {
  if (typeof plain !== "string" || plain.length < 8) throw new Error("Password must be at least 8 characters");
  this.passwordHash = await bcrypt.hash(plain, 12);
};

userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.isLocked = function () {
  return Boolean(this.lockedUntil && this.lockedUntil > new Date());
};

userSchema.methods.toSafeJSON = function () {
  return { id: this._id, name: this.name, email: this.email, role: this.role, lastLoginAt: this.lastLoginAt };
};

export default mongoose.model("User", userSchema);
