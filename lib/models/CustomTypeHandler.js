function CustomTypeHandler(type) {
    this.type = type;
}
CustomTypeHandler.prototype.type = undefined;
CustomTypeHandler.prototype.handler = undefined;

module.exports = CustomTypeHandler;