describe("Investigation Master.controller Tests", function () {
    // jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
    jQuery.sap.require({
        modName : "sap.secmon.ui.m.invest.view.Master",
        type : "controller"
    });
    jQuery.sap.require("test.TestHelper");
    var libUnderTest;
    var view, dialog, parentView, errorHandler, bindingContext, router, uicomponent, event, namespaceSelect, component, model, control,
        controllerHelper, column, splitter, table,tableScrollContainer, layoutData, binding, queryExtractor, vetoCollector;
    afterEach(function () {
    });
    beforeEach(function () {
        libUnderTest = sap.ui.controller("sap.secmon.ui.m.invest.view.Master");
        view = test.TestHelper.createMockView();
        control = test.TestHelper.createMockControl();
        dialog = test.TestHelper.createMockDialog(view);
        parentView = test.TestHelper.createMockView();
        bindingContext = test.TestHelper.createMockBindingContext();
        splitter = jasmine.createSpyObj("splitter", ["getContentAreas", "addContentArea", "removeContentArea"]);
        tableScrollContainer = jasmine.createSpyObj("tableScrollContainer", ["getLayoutData"]);
        column = jasmine.createSpyObj("column", ["getSortProperty", "setSorted", "setSortOrder"]);
        table = jasmine.createSpyObj("table", ["getColumns", "bindItems", "getBinding"]);
        binding = jasmine.createSpyObj("binding", ["attachDataReceived", "filter"]);
        layoutData = jasmine.createSpyObj("layoutData",["setSize"]);
        vetoCollector = jasmine.createSpyObj("vetoCollector", ["noVetoExists"]);
        queryExtractor = jasmine.createSpyObj("queryExtractor", ["extractFilters", "extractSorter"]);
        spyOn(libUnderTest, "getView").and.returnValue(view);
        
        event = test.TestHelper.createMockEvent();
        namespaceSelect = jasmine.createSpyObj("namespaceSelect", [ "removeItem", "bindAggregation", "getSelectedItem" ]);
        router = test.TestHelper.createMockRouter();
        component = jasmine.createSpyObj("component", [ "getCsrfToken", "getModel", "getNavigationVetoCollector" ]);
        spyOn(libUnderTest, "getComponent").and.returnValue(component);
        uicomponent = jasmine.createSpyObj("uicomponent", [ "getRouterFor" ]);
        model = jasmine.createSpyObj("model", [ "getData", "setData", "getServiceMetadata", "getProperty" ]);
        controllerHelper = jasmine.createSpyObj("controllerHelper", ["getFilterInputIdsOfFilterBar", 
            "getTemplate"]);
        spyOn(sap.ui.core.UIComponent, "getRouterFor").and.returnValue(router);
        sap.ui.Device.system.phone = false;
        spyOn(sap.ui, "xmlfragment").and.returnValue(dialog);
      

    });
    it("constructor Test", function () {
        expect(libUnderTest.oCommons).not.toBeUndefined();
        expect(libUnderTest.filterAlreadySet).not.toBeUndefined();
        expect(libUnderTest.sSessionUser).not.toBeUndefined();
    });
    it("onInit", function () {
        view.byId.and.returnValue(control);
        libUnderTest.onInit.call(libUnderTest);
        expect(control.attachEventOnce).toHaveBeenCalled();
        expect(libUnderTest.queryExtractor).not.toBeUndefined();
        expect(router.attachRouteMatched).toHaveBeenCalled();
    });
   
    it("onRouteMatched without parameters", function () {
        event.getParameter.and.returnValue(undefined);
        expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
        expect(router.navTo).not.toHaveBeenCalled();
    });
   
    it("onRouteMatched route to main", function () {
        view.byId.and.returnValue(control);
        event.getParameter.and.returnValue("main");
        control.getItems.and.returnValue([]);
        libUnderTest.queryExtractor = queryExtractor;
        expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
        expect(queryExtractor.extractFilters).not.toHaveBeenCalled();
        expect(queryExtractor.extractSorter).not.toHaveBeenCalled();
    });

    it("onRouteMatched with query parameters", function () {
        view.byId.and.returnValue(control);
        event.getParameter.and.callFake(function(x) {switch(x) { case "name":return "main"; case "arguments" : return {"?query" : "query"};}});
        spyOn(  sap.secmon.ui.commons.FilterSortUtil,"applyFiltersAndSorterToTable");
        control.getItems.and.returnValue([]);
        libUnderTest.queryExtractor = queryExtractor;
        queryExtractor.extractFilters.and.returnValue([]);
        queryExtractor.extractSorter.and.returnValue([]);
        expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
        expect(queryExtractor.extractFilters).toHaveBeenCalled();
        expect(queryExtractor.extractSorter).toHaveBeenCalled();
        expect(sap.secmon.ui.commons.FilterSortUtil.applyFiltersAndSorterToTable)
    });
    it("onRouteMatched with query parameters", function () {
        view.byId.and.returnValue(control);
        event.getParameter.and.callFake(function(x) {switch(x) { case "name":return "main"; case "arguments" : return {"?query" : "query"};}});
        spyOn(  sap.secmon.ui.commons.FilterSortUtil,"applyFiltersAndSorterToTable");
        control.getItems.and.returnValue([]);
        libUnderTest.queryExtractor = queryExtractor;
        queryExtractor.extractFilters.and.returnValue([]);
        queryExtractor.extractSorter.and.returnValue([]);
        expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
        expect(queryExtractor.extractFilters).toHaveBeenCalled();
        expect(queryExtractor.extractSorter).toHaveBeenCalled();
        expect(sap.secmon.ui.commons.FilterSortUtil.applyFiltersAndSorterToTable)
    });
    it("onRouteMatched with query parameters and name investigation", function () {
        var item = jasmine.createSpyObj("item", ["getBindingContext"]);
        item.getBindingContext.and.returnValue(bindingContext);
        view.byId.and.returnValue(control);
        bindingContext.getPath.and.returnValue("/investigationId(X'4711')");
        event.getParameter.and.callFake(function(x) {switch(x) { case "name":return "investigation"; case "arguments" : return {"investigation" : "investigationId(X'4711')"};}});
        spyOn(sap.secmon.ui.commons.FilterSortUtil,"applyFiltersAndSorterToTable");
        control.getItems.and.returnValue([item]);
        libUnderTest.queryExtractor = queryExtractor;
        queryExtractor.extractFilters.and.returnValue([]);
        queryExtractor.extractSorter.and.returnValue([]);
        expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
        expect(control.setSelectedItem).toHaveBeenCalledWith(item, true);
       
    });

    it("onSearch with search string", function() {
        libUnderTest.aPresetFilters = [];
        view.byId.and.returnValue(control);
        control.getValue.and.returnValue("Search");
        control.getBinding.and.returnValue(binding);
        libUnderTest.onSearch.call(libUnderTest);
        expect(binding.filter).toHaveBeenCalled();
        expect(binding.filter.calls.argsFor(0)[0]).not.toBeUndefined();
        expect(binding.filter.calls.argsFor(0)[0].length).toBe(1);
    });
    it("onSearch without search string", function() {
        libUnderTest.aPresetFilters = [];
        view.byId.and.returnValue(control);
        control.getValue.and.returnValue();
        control.getBinding.and.returnValue(binding);
        libUnderTest.onSearch.call(libUnderTest);
        expect(binding.filter).toHaveBeenCalled();
        expect(binding.filter.calls.argsFor(0)[0]).not.toBeUndefined();
        expect(binding.filter.calls.argsFor(0)[0].length).toBe(0);
    });
    it("onSelect", function() {
        var item = jasmine.createSpyObj("item", ["getBindingContext"]);
        var promise = jasmine.createSpyObj("promise", ["done", "fail"]);
        promise.done.and.returnValue(promise);
        component.getNavigationVetoCollector.and.returnValue(vetoCollector);
        item.getBindingContext.and.returnValue(bindingContext);
        bindingContext.getPath.and.returnValue("/Path");
        vetoCollector.noVetoExists.and.returnValue(promise);
        event.getParameter.and.returnValue(item);
        view.byId.and.returnValue(control);
        control.getSelectedItem.and.returnValue(item);
        libUnderTest.onSelect.call(libUnderTest, event);
        promise.done.calls.argsFor(0)[0]();
        expect(router.navTo).toHaveBeenCalled();
        expect(router.navTo.calls.argsFor(0)[0]).toEqual("investigation");
        expect(router.navTo.calls.argsFor(0)[1].investigation).toEqual("Path");
        expect(router.navTo.calls.argsFor(0)[1].tab).toEqual("discussion");
    });

});
