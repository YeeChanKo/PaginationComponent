$(function () {
  var p = new VizPaginator(".pagination", "#content", {
    getTotalItemCount: {
      url: "http://128.199.76.9:8002/viz/todo/count",
      parser: function (data) {
        return data.cnt;
      },
      fail: function () {
        alert("request failed");
      }
    },
    getRangeOfItems: {
      // start is {{0}}, limit is {{1}}
      url: "http://128.199.76.9:8002/viz/todo/page?start={{0}}&limit={{1}}",
      parser: function (data, index) {
        return data[index].todo; // parse json data, index loop through 0 to limit-1
      },
      // done : function(data){
      //   // completely override done method
      // },
      fail: function () {
        alert("request failed");
      }
    },
    maxItemCount: 3,
    maxPageCount: 5
  });
});
