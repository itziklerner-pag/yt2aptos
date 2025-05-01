"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseSchemaOptions = void 0;
exports.createSchema = createSchema;
const mongoose_1 = require("mongoose");
/**
 * Base schema options with common settings for all models
 */
exports.baseSchemaOptions = {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (_, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
    toObject: {
        virtuals: true,
        transform: (_, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
};
/**
 * Create a schema with base options
 * @param definition Schema definition
 * @param options Additional schema options
 * @returns Mongoose schema with base options
 */
function createSchema(definition, options) {
    return new mongoose_1.Schema(definition, {
        ...exports.baseSchemaOptions,
        ...options,
    });
}
//# sourceMappingURL=base.model.js.map