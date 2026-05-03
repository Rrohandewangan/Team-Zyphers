import { asyncHandler } from "../utils/asyncHandler.js";
import { authService } from "../services/auth/auth.service.js";
import { ok } from "../middleware/error.middleware.js";
import { userRepo } from "../repositories/user.repo.js";
import { ApiError } from "../utils/ApiError.js";

export const authController = {
  register: asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    ok(res, { user }, "Registered", 201);
  }),

  me: asyncHandler(async (req, res) => {
    const user = await userRepo.findById(req.user.id);
    if (!user) throw new ApiError(404, "User not found");
    ok(res, {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      age: user.age,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      emergencyContact: user.emergencyContact,
      profileComplete: user.profileComplete,
    });
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const { age, gender, bloodGroup, emergencyContact } = req.body;
    const updates = { profileComplete: true };
    if (age != null) updates.age = age;
    if (gender) updates.gender = gender;
    if (bloodGroup) updates.bloodGroup = bloodGroup;
    if (emergencyContact) updates.emergencyContact = emergencyContact;

    const user = await userRepo.updateById(req.user.id, updates);
    if (!user) throw new ApiError(404, "User not found");
    ok(res, {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      age: user.age,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      emergencyContact: user.emergencyContact,
      profileComplete: user.profileComplete,
    }, "Profile updated");
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    ok(res, result, "Logged in");
  }),

  refresh: asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body.refreshToken);
    ok(res, result, "Token rotated");
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    ok(res, null, "Logged out");
  }),
};
