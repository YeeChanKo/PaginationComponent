$(function () {
  var singleTodo = $("#single-todo").html();
  var multipleTodo = $("#multiple-todo").html();
  Handlebars.registerPartial("singleTodo", singleTodo);
  var multipleTodoTemplate = Handlebars.compile(multipleTodo);

  var totalPages = 18;
  var pagesPerGroup = 5;
  var itemsPerPage = 3;
  var url = "http://128.199.76.9:8002/viz/todo/page?start={{start}}&limit=" + itemsPerPage;

  var contentsArea = $("#content");
  var paginator = new VizPaginator(".pagination", totalPages, pagesPerGroup);
  var memoizationMap = new Map();

  paginator.on("pageChanged", function (obj) {
    var pageNumber = obj.index;
    var requestUrl = url.replace("{{start}}", itemsPerPage * (pageNumber - 1));
    var data = memoizationMap.get(pageNumber);
    if (data) {
      handleData(data);
    } else {
      $.ajax(requestUrl).done(function (data) {
        memoizationMap.set(pageNumber, data);
        handleData(data);
      });
    }
  });

  var handleData = function (data) {
    var todoElements = multipleTodoTemplate({
      "todos": data
    });
    $("#content").text(""); // clear
    $(todoElements).appendTo($("#content"));
  };
});
