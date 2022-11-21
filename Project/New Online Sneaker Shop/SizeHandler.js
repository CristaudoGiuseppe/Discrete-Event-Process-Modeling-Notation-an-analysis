class SizeHandler extends oBJECT {
  constructor({ id, name, status}) {
    super( id, name);
    this.status = status;
  }
}
SizeHandler.labels = {"status":"st", "activityState":"act"};
