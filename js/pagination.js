function VizPaginator(paginationSelector, totalPages, pagesPerGroup) {
  this.$pagination = $(paginationSelector);
  this.$prevButton = $(this.$pagination.children(".viz-page-prev")[0]);
  this.$nextButton = $(this.$pagination.children(".viz-page-next")[0]);
  this.$prevGroupButton = $(this.$pagination.children(".viz-page-prev-group")[0]);
  this.$nextGroupButton = $(this.$pagination.children(".viz-page-next-group")[0]);
  this.eventEmitter = new EventEmitter();
  // TODO: 아예 settings로 받기, li도, totalGroups만 추가
  this.settings = {
    "totalPages": totalPages,
    "pagesPerGroup": pagesPerGroup,
    "totalGroups": Math.ceil(totalPages / pagesPerGroup)
  };
  this.init();
}

VizPaginator.prototype.init = function () {
  // set initial page & group
  this.status = {
    "currentPage": 1,
    "currentGroup": 1
  };

  // set listeners
  this.$pagination.on("click", ".viz-page-item", this.buttonClicked(function (e) {
    this.changePage(Number($(e.target).text()));
  }));
  this.$pagination.on("click", ".viz-page-prev", this.buttonClicked(function () {
    this.changePageRelatively(-1);
  }));
  this.$pagination.on("click", ".viz-page-next", this.buttonClicked(function () {
    this.changePageRelatively(1);
  }));
  this.$pagination.on("click", ".viz-page-prev-group", this.buttonClicked(function () {
    this.changePage((this.status.currentGroup - 2) * this.settings.pagesPerGroup + 1);
  }));
  this.$pagination.on("click", ".viz-page-next-group", this.buttonClicked(function () {
    this.changePage(this.status.currentGroup * this.settings.pagesPerGroup + 1);
  }));

  // set up pages
  this.setupPages();
};

VizPaginator.prototype.setupPages = function () {
  var liString = "<li class=\"viz-page-item\" style=\"{{css}}\"><a href>{{pageNumber}}</a></li>";

  var eleString = "";
  for (var i = 0; i < this.settings.pagesPerGroup; i++) {
    eleString += liString.replace("{{css}}", "").replace("{{pageNumber}}", i + 1);
  }
  for (var j = this.settings.pagesPerGroup; j < this.settings.totalPages; j++) {
    eleString += liString.replace("{{css}}", "display:none").replace("{{pageNumber}}", j + 1);
  }

  // delete existing
  this.$pagination.children(".viz-page-item").remove();
  // add created
  this.$prevButton.after(eleString);
  // set pages reference
  this.$pages = this.$pagination.children(".viz-page-item");
  // set current page active
  $(this.$pages[this.status.currentPage - 1]).addClass("active");
  // set nav buttons status
  this.setNavButtonStatus();
  // emit move event
  this.emitPageChangedEvent();
};

VizPaginator.prototype.buttonClicked = function (func) {
  return function (e) {
    e.preventDefault();
    if (this.isButtonEnabled($(e.currentTarget))) {
      func.bind(this)(e);
    }
  }.bind(this);
};

VizPaginator.prototype.changePageRelatively = function (distance) {
  this.changePage(this.status.currentPage + distance);
};

VizPaginator.prototype.changePage = function (pageNumber) {
  // ignore when clicked on same page
  if (pageNumber == this.status.currentPage) {
    return;
  }

  // change page group if needed
  var group = Math.ceil(pageNumber / this.settings.pagesPerGroup);
  if (group != this.status.currentGroup) {
    this.changePageGroup(group);
  }

  // save last active page reference, change current page
  this.status.lastActivePage = this.status.currentPage;
  this.status.currentPage = pageNumber;

  // change active
  $(this.$pages[this.status.lastActivePage - 1]).removeClass("active");
  $(this.$pages[this.status.currentPage - 1]).addClass("active");

  // set nav buttons status
  this.setNavButtonStatus();

  // emit move event
  this.emitPageChangedEvent();
};

VizPaginator.prototype.emitPageChangedEvent = function () {
  this.eventEmitter.emit("pageChanged", {
    index: this.status.currentPage,
    max: this.settings.totalPages
  });
};

VizPaginator.prototype.changePageGroupRelatively = function (distance) {
  this.changePageGroup(this.status.currentGroup + distance);
};

VizPaginator.prototype.changePageGroup = function (group) {
  this.status.lastActiveGroup = this.status.currentGroup;
  this.status.currentGroup = group;
  this.$pages.css("display", "none");
  var first = (this.status.currentGroup - 1) * this.settings.pagesPerGroup + 1;
  var last = this.status.currentGroup * this.settings.pagesPerGroup;
  for (var i = first; i <= last; i++) {
    $(this.$pages[i - 1]).css("display", "");
  }
};

VizPaginator.prototype.disableButton = function ($li) {
  $li.addClass("disabled");
};

VizPaginator.prototype.enableButton = function ($li) {
  $li.removeClass("disabled");
};

VizPaginator.prototype.isButtonEnabled = function ($li) {
  return !$li.hasClass("disabled");
};

VizPaginator.prototype.setNavButtonStatus = function () {
  if (this.status.currentPage === 1) {
    this.disableButton(this.$prevButton);
  } else {
    this.enableButton(this.$prevButton);
  }

  if (this.status.currentPage + 1 > this.settings.totalPages) {
    this.disableButton(this.$nextButton);
  } else {
    this.enableButton(this.$nextButton);
  }

  if (this.status.currentGroup === 1) {
    this.disableButton(this.$prevGroupButton);
  } else {
    this.enableButton(this.$prevGroupButton);
  }

  if (this.status.currentGroup + 1 > this.settings.totalGroups) {
    this.disableButton(this.$nextGroupButton);
  } else {
    this.enableButton(this.$nextGroupButton);
  }
};

VizPaginator.prototype.on = function (event, callback) {
  this.eventEmitter.addListener(event, callback);
};

VizPaginator.prototype.off = function (event, callback) {
  this.eventEmitter.removeListener(event, callback);
};
