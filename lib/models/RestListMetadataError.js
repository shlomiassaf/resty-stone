function RestListMetadataError(list, message) {
    this.name = "RestListMetadataError [" + list.key + "]";
    this.message = message;
}
module.exports = RestListMetadataError