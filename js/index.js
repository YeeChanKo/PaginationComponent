$(function () {
  var singleTodo = $("#single-todo").html();
  var multipleTodo = $("#multiple-todo").html();
  Handlebars.registerPartial("singleTodo", singleTodo);
  var multipleTodoTemplate = Handlebars.compile(multipleTodo);

  var p = new VizPaginator(".pagination", "#content", {
    getTotalItemCount: {
      url: "http://128.199.76.9:8002/viz/todo/count",
      parser: function (data) {
        return data.cnt;
      }
    },
    getRangeOfItems: {
      // start is {{0}}, limit is {{1}}
      url: "http://128.199.76.9:8002/viz/todo/page?start={{0}}&limit={{1}}",
      // parser: function (data, index) {
      //   return data[index].todo; // parse json data, index loop through 0 to limit-1
      // },
      done: function (data) {
        // completely override done method
        var todoElements = multipleTodoTemplate({
          "todos": data
        });
        $("#content").text(""); // clear
        $(todoElements).appendTo($("#content"));
      }
    },
    // maxItemCount: 3
    // maxPageCount: 3
  });
});
