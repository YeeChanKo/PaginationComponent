asyncTest("Ajax", function () {
  expect(1);

  var paginator = new VizPaginator(".pagination", "#content", {
    getTotalItemCount: {
      url: "http://128.199.76.9:8002/viz/todo/count",
      parser: function (data) {
        return data.cnt;
      }
    },
    getRangeOfItems: {
      url: "http://128.199.76.9:8002/viz/todo/page?start={{0}}&limit={{1}}",
      parser: function (data, index) {
        return data[index].todo;
      }
    },
  });
});
