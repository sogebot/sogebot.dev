"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Plugin = void 0;
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
let Plugin = class Plugin {
};
(0, tslib_1.__decorate)([
    (0, typeorm_1.PrimaryColumn)({ generated: 'uuid' }),
    (0, tslib_1.__metadata)("design:type", String)
], Plugin.prototype, "id", void 0);
(0, tslib_1.__decorate)([
    (0, typeorm_1.Column)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(4),
    (0, tslib_1.__metadata)("design:type", String)
], Plugin.prototype, "name", void 0);
(0, tslib_1.__decorate)([
    (0, typeorm_1.Column)({ type: 'text' }),
    (0, tslib_1.__metadata)("design:type", String)
], Plugin.prototype, "description", void 0);
(0, tslib_1.__decorate)([
    (0, typeorm_1.Column)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, tslib_1.__metadata)("design:type", String)
], Plugin.prototype, "publisherId", void 0);
(0, tslib_1.__decorate)([
    (0, typeorm_1.Column)({ type: 'varchar', length: '2022-07-27T00:30:34.569259834Z'.length }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, tslib_1.__metadata)("design:type", String)
], Plugin.prototype, "publishedAt", void 0);
(0, tslib_1.__decorate)([
    (0, typeorm_1.Column)({ type: 'json' }),
    (0, tslib_1.__metadata)("design:type", Array)
], Plugin.prototype, "votes", void 0);
(0, tslib_1.__decorate)([
    (0, typeorm_1.Column)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsInt)(),
    (0, tslib_1.__metadata)("design:type", Number)
], Plugin.prototype, "version", void 0);
(0, tslib_1.__decorate)([
    (0, typeorm_1.Column)({ type: 'text' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, tslib_1.__metadata)("design:type", Number)
], Plugin.prototype, "plugin", void 0);
Plugin = (0, tslib_1.__decorate)([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Unique)('NamePublisherVersion', ['name', 'publisherId', 'version'])
], Plugin);
exports.Plugin = Plugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2VudGl0eS9QbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLHFDQUErRDtBQUMvRCxxREFBK0Q7QUFJL0QsSUFBYSxNQUFNLEdBQW5CLE1BQWEsTUFBTTtDQStCbEIsQ0FBQTtBQTdCRztJQURDLElBQUEsdUJBQWEsRUFBQyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsQ0FBQzs7a0NBQzNCO0FBS1Y7SUFIQyxJQUFBLGdCQUFNLEdBQUU7SUFDUixJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDJCQUFTLEVBQUMsQ0FBQyxDQUFDOztvQ0FDRDtBQUdaO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDOzsyQ0FDTjtBQUluQjtJQUZDLElBQUEsZ0JBQU0sR0FBRTtJQUNSLElBQUEsNEJBQVUsR0FBRTs7MkNBQ007QUFJbkI7SUFGQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxnQ0FBZ0MsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUM1RSxJQUFBLDRCQUFVLEdBQUU7OzJDQUNNO0FBR25CO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDOztxQ0FDZ0I7QUFLekM7SUFIQyxJQUFBLGdCQUFNLEdBQUU7SUFDUixJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLHVCQUFLLEdBQUU7O3VDQUNRO0FBSWhCO0lBRkMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDO0lBQ3hCLElBQUEsNEJBQVUsR0FBRTs7c0NBQ0U7QUE5Qk4sTUFBTTtJQUZsQixJQUFBLGdCQUFNLEdBQUU7SUFDUixJQUFBLGdCQUFNLEVBQUMsc0JBQXNCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0dBQ3RELE1BQU0sQ0ErQmxCO0FBL0JZLHdCQUFNIn0=