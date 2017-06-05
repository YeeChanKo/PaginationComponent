$(function () {
  var p = new VizPaginator(".pagination", "#content", {
    url: "http://128.199.76.9:8002/viz/todo",
    maxItemCount: 3,
    maxPageCount: 5
  });
});
