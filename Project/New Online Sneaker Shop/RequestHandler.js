class RequestHandler extends oBJECT {
  constructor({ id, name, status}) {
    super( id, name);
    this.status = status;
  }
}
RequestHandler.labels = {"status":"st", "activityState":"act"};
