$(function () {
  var singleTodo = $("#single-todo").html();
  var multipleTodo = $("#multiple-todo").html();
  Handlebars.registerPartial("singleTodo", singleTodo);
  var multipleTodoTemplate = Handlebars.compile(multipleTodo);

  var paginator = new VizPaginator(".pagination", "#content", {
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

  // paginator.on("move", function (obj) {
  //   console.log(obj);
  // });
});

function VizPaginator(paginationSelector, contentSelector, settings) {
  this.ee = new EventEmitter();
  this.memoMap = new Map(); // map for memoization

  this.$pagination = $(paginationSelector);
  this.$content = $(contentSelector);

  this.$prevButton = $(this.$pagination.children(".viz-page-prev")[0]);
  this.$nextButton = $(this.$pagination.children(".viz-page-next")[0]);
  this.$prevGroupButton = $(this.$pagination.children(".viz-page-prev-group")[0]);
  this.$nextGroupButton = $(this.$pagination.children(".viz-page-next-group")[0]);
  this.$pages = this.$pagination.children("li:not(.viz-page-prev):not(.viz-page-next)" +
    ":not(.viz-page-prev-group):not(.viz-page-next-group)");

  this.baseUrl = settings.baseUrl;
  this.getTotalItemCountOpt = settings.getTotalItemCount;
  this.getRangeOfItemsOpt = settings.getRangeOfItems;

  // default values:
  // maxItemCount - 3
  // maxPageCount - 5
  this.maxItemCount = settings.maxItemCount ? settings.maxItemCount : 3;
  this.maxPageCount = settings.maxPageCount ? settings.maxPageCount : 5;

  if (!(this.baseUrl || (this.getTotalItemCountOpt && this.getRangeOfItemsOpt))) {
    throw "You should pass either baseUrl or (getTotalItemCountOpt and getRangeOfItemsOpt)!";
  }

  // set smart options for request urls
  this.getTotalItemCountAjax = this.createGetTotalItemCountAjax(this.getTotalItemCountOpt.url,
    this.baseUrl, this.getTotalItemCountOpt.parser, this.getTotalItemCountOpt.fail);
  this.getRangeOfItemsAjax = this.createGetRangeOfItemsAjax(this.getRangeOfItemsOpt.url,
    this.baseUrl, this.getRangeOfItemsOpt.parser, this.getRangeOfItemsOpt.done, this.getRangeOfItemsOpt.fail);

  this.init();
}

VizPaginator.prototype.init = function () {
  // set initial page group
  this.currentPageGroup = 1;

  // set listeners
  this.$pages.on("click", this.pageOnClickCallback.bind(this));
  this.$prevButton.on("click", this.prevOnClickCallback.bind(this));
  this.$nextButton.on("click", this.nextOnClickCallback.bind(this));
  this.$prevGroupButton.on("click", this.prevGroupOnClickCallback.bind(this));
  this.$nextGroupButton.on("click", this.nextGroupOnClickCallback.bind(this));
  this.ee.addListener("move", this.pageChangedCallback.bind(this));

  // set total count & total page, disable extra pages & next button if needed
  this.getTotalItemCountAjax();

  // set current active, load initial data
  this.changePage(1);
};

VizPaginator.prototype.createGetTotalItemCountAjax = function (url, baseUrl, parser, failCb) {
  // default values:
  // url - baseUrl + "/count"
  // parser - data.count
  // failCb - (see below)

  return function () {
    $.ajax(url ? url : baseUrl + "/count").done(function (data) {
      this.totalItemCount = parser ? parser(data) : data.count; // default
      this.totalPageCount = Math.ceil(this.totalItemCount / this.maxItemCount);

      // initial setting
      this.enableOrDisablePageButtons();
      if (this.totalPageCount === 1) {
        this.disableButton(this.$nextButton);
      }
    }.bind(this)).fail(failCb ? failCb : function () {
      alert("Server request failed!\nPlease check your network status and reload the page.");
    });
  }.bind(this);
};

VizPaginator.prototype.createGetRangeOfItemsAjax = function (url, baseUrl, parser, doneCb, failCb) {
  // default values:
  // url - baseUrl + "/page?start={{0}}&limit={{1}}"
  // parser - data[index].count
  // doneCb - (see below)
  // failCb - (see below)

  this.getRangeOfItemsAjaxDoneCallback = doneCb ? doneCb : function (data) {
    // set parser
    var jsonParser = parser ? parser : function (data, index) {
      return data[index].content;
    };
    // parse data and set text on list items
    for (var i = 0; i < data.length; i++) {
      this.$content.children("li:nth-child(" + (i + 1) + ")").text(jsonParser(data, i));
    }
    // empty extra list items
    for (var j = data.length; j < this.maxItemCount; j++) {
      this.$content.children("li:nth-child(" + (j + 1) + ")").text("");
    }
  }.bind(this);

  return function (start, limit, pageNumber) {
    var urlSkeleton = url ? url : baseUrl + "/page?start={{0}}&limit={{1}}";
    $.ajax(urlSkeleton.replace("{{0}}", start).replace("{{1}}", limit))
      .done(function (data) {
        this.memoMap.set(pageNumber, data); // save data into memoMap
        this.getRangeOfItemsAjaxDoneCallback(data);
      }.bind(this)).fail(failCb ? failCb : function () {
        alert("Server request failed!\nPlease check your network status and reload the page.");
      });
  }.bind(this);
};

VizPaginator.prototype.disableButton = function ($li) {
  $li.children("a").attr("disabled", "");
};

VizPaginator.prototype.enableButton = function ($li) {
  $li.children("a").removeAttr("disabled");
};

VizPaginator.prototype.isButtonEnabled = function ($li) {
  return !$li.children("a").attr("disabled");
};

VizPaginator.prototype.enableOrDisablePageButtons = function () {
  var disableStartPoint = this.totalPageCount - (this.currentPageGroup - 1) * this.maxPageCount;
  var disableStopPoint = this.maxPageCount * this.currentPageGroup;

  if (disableStartPoint >= this.maxPageCount) {
    for (var i = 0; i < this.maxPageCount; i++) {
      this.enableButton($(this.$pages[i]));
    }
  } else {
    for (var j = 0; j < disableStartPoint; j++) {
      this.enableButton($(this.$pages[j]));
    }
    for (var k = disableStartPoint; k < disableStopPoint; k++) {
      this.disableButton($(this.$pages[k]));
    }
  }
};

VizPaginator.prototype.pageChangedCallback = function (obj) {
  if (obj.index === 1) {
    this.disableButton(this.$prevButton);
  } else {
    this.enableButton(this.$prevButton);
  }

  if (obj.index - this.maxPageCount < 1) {
    this.disableButton(this.$prevGroupButton);
  } else {
    this.enableButton(this.$prevGroupButton);
  }

  if (obj.index === this.totalPageCount) {
    this.disableButton(this.$nextButton);
  } else {
    this.enableButton(this.$nextButton);
  }

  if (obj.index + this.maxPageCount > this.totalPageCount) {
    this.disableButton(this.$nextGroupButton);
  } else {
    this.enableButton(this.$nextGroupButton);
  }
};

VizPaginator.prototype.pageOnClickCallback = function (e) {
  e.preventDefault();
  if (this.isButtonEnabled($(e.target))) {
    var pageNumber = Number($(e.target).text());
    this.changePage(pageNumber);
  }
};

VizPaginator.prototype.prevOnClickCallback = function (e) {
  e.preventDefault();
  if (this.isButtonEnabled($(e.target))) {
    this.changePageRelatively(-1);
  }
};

VizPaginator.prototype.nextOnClickCallback = function (e) {
  e.preventDefault();
  if (this.isButtonEnabled($(e.target))) {
    this.changePageRelatively(1);
  }
};

VizPaginator.prototype.prevGroupOnClickCallback = function (e) {
  e.preventDefault();
  if (this.isButtonEnabled($(e.target))) {
    this.changePageRelatively(-this.maxPageCount);
  }
};

VizPaginator.prototype.nextGroupOnClickCallback = function (e) {
  e.preventDefault();
  if (this.isButtonEnabled($(e.target))) {
    this.changePageRelatively(this.maxPageCount);
  }
};

VizPaginator.prototype.changePageRelatively = function (distance) {
  var currentPageNumber = Number(this.$currentActive.text());
  var pageNumber = currentPageNumber + distance;
  this.changePage(pageNumber);
};

VizPaginator.prototype.changePage = function (pageNumber) {
  // change page group if needed
  var firstPageNumber = $(this.$pages[0]).text();
  var lastPageNumber = $(this.$pages[this.maxPageCount - 1]).text();

  if (pageNumber < firstPageNumber) {
    this.changePageGroup(-1);
  } else if (pageNumber > lastPageNumber) {
    this.changePageGroup(1);
  }

  // get data from memoMap
  // request only when data does not exist
  var data = this.memoMap.get(pageNumber);
  if (data) {
    this.getRangeOfItemsAjaxDoneCallback(data);
  } else {
    this.changeContent(pageNumber);
  }

  // change activated li
  if (this.$currentActive) {
    this.$currentActive.removeClass("active");
  }
  var targetPageIndex = pageNumber - this.maxPageCount * (this.currentPageGroup - 1) - 1;
  this.$currentActive = $(this.$pages[targetPageIndex]);
  this.$currentActive.addClass("active");

  // emit move event
  this.ee.emit("move", {
    index: pageNumber,
    max: this.totalPageCount
  });
};

VizPaginator.prototype.changeContent = function (pageNumber) {
  var start = (pageNumber - 1) * this.maxItemCount;
  var limit = this.maxItemCount;

  this.getRangeOfItemsAjax(start, limit, pageNumber);
};

VizPaginator.prototype.changePageGroup = function (distance) {
  this.currentPageGroup += distance;
  for (var i = 0; i < this.maxPageCount; i++) {
    var $aTag = $(this.$pages[i]).children("a");
    var pageNumber = Number($aTag.text()) + distance * this.maxPageCount;
    $aTag.text(pageNumber);
  }
  this.enableOrDisablePageButtons();
};

VizPaginator.prototype.on = function (event, callback) {
  this.ee.addListener(event, callback);
};

VizPaginator.prototype.off = function (event, callback) {
  this.ee.removeListener(event, callback);
};
