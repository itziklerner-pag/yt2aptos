"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../user.model");
// Use in-memory MongoDB instance setup in setup.ts
describe('User Model', () => {
    // Test data
    const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword123',
        isAdmin: false,
    };
    // Clean up after tests
    afterAll(async () => {
        await user_model_1.UserModel.deleteMany({});
    });
    it('should create a new user successfully', async () => {
        const user = new user_model_1.UserModel(userData);
        const savedUser = await user.save();
        // Check the saved user
        expect(savedUser._id).toBeDefined();
        expect(savedUser.username).toBe(userData.username);
        expect(savedUser.email).toBe(userData.email);
        expect(savedUser.password).toBe(userData.password);
        expect(savedUser.isAdmin).toBe(userData.isAdmin);
        expect(savedUser.createdAt).toBeDefined();
        expect(savedUser.updatedAt).toBeDefined();
    });
    it('should require username, email and password', async () => {
        const userWithoutUsername = new user_model_1.UserModel({
            email: 'test@example.com',
            password: 'password123',
        });
        const userWithoutEmail = new user_model_1.UserModel({
            username: 'testuser',
            password: 'password123',
        });
        const userWithoutPassword = new user_model_1.UserModel({
            username: 'testuser',
            email: 'test@example.com',
        });
        // Test validation for each case
        await expect(userWithoutUsername.validate()).rejects.toThrow();
        await expect(userWithoutEmail.validate()).rejects.toThrow();
        await expect(userWithoutPassword.validate()).rejects.toThrow();
    });
    it('should not allow duplicate emails', async () => {
        // Create a user with the test email
        await new user_model_1.UserModel(userData).save();
        // Try to create another user with the same email
        const duplicateUser = new user_model_1.UserModel({
            username: 'another',
            email: userData.email,
            password: 'password456',
        });
        // This should fail because of duplicate email
        await expect(duplicateUser.save()).rejects.toThrow();
    });
    it('should set default values', async () => {
        const userWithoutOptionalFields = new user_model_1.UserModel({
            username: 'minimalist',
            email: 'min@example.com',
            password: 'password123',
        });
        const savedUser = await userWithoutOptionalFields.save();
        // Check that default values were set
        expect(savedUser.isAdmin).toBe(false);
        expect(savedUser.profile).toEqual({});
    });
    it('should save and retrieve user correctly with typed interface', async () => {
        // This test ensures type safety by using the User interface
        const typedUser = {
            username: 'typeduser',
            email: 'typed@example.com',
            password: 'typedpassword',
            isAdmin: true,
            profile: {
                displayName: 'Typed User',
                bio: 'I am a typed user',
            },
        };
        const user = new user_model_1.UserModel(typedUser);
        await user.save();
        // Retrieve the user
        const retrievedUser = await user_model_1.UserModel.findOne({ email: typedUser.email });
        // Check that all fields were saved correctly
        expect(retrievedUser).toBeDefined();
        expect(retrievedUser.username).toBe(typedUser.username);
        expect(retrievedUser.email).toBe(typedUser.email);
        expect(retrievedUser.password).toBe(typedUser.password);
        expect(retrievedUser.isAdmin).toBe(typedUser.isAdmin);
        expect(retrievedUser.profile.displayName).toBe(typedUser.profile.displayName);
        expect(retrievedUser.profile.bio).toBe(typedUser.profile.bio);
    });
    it('should exclude password in toJSON transformation', async () => {
        const user = new user_model_1.UserModel(userData);
        await user.save();
        // Convert to JSON (simulating response serialization)
        const userObject = user.toJSON();
        // Password should be excluded
        expect(userObject.password).toBeUndefined();
        // But other fields should be present
        expect(userObject._id).toBeDefined();
        expect(userObject.username).toBe(userData.username);
        expect(userObject.email).toBe(userData.email);
    });
});
//# sourceMappingURL=user.model.test.js.map