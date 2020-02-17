describe("AlertGraph.controller Tests", function () {
    // jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
    jQuery.sap.require({
        modName : "sap.secmon.ui.m.alertsfs.view.AlertGraph",
        type : "controller"
    });
    jQuery.sap.require("test.TestHelper");
    var libUnderTest;
    var view, dialog, parentView, errorHandler, bindingContext, router, uicomponent, event, namespaceSelect, component, model, control,
        controllerHelper, column, vetoCollector, resourceBundle;
    afterEach(function () {
    });
    beforeEach(function () {
        libUnderTest = sap.ui.controller("sap.secmon.ui.m.alertsfs.view.AlertGraph");
    
        control = jasmine.createSpyObj("control", [ "setValueState", "getSelected", "setValue", "setText", "setVisible", "getVisible", "getColumns", "bindItems", "getBinding" ]);
        view = test.TestHelper.createMockView();
        view.createId.and.callFake(function(x) {return x;});
        bindingContext = test.TestHelper.createMockBindingContext();
        vetoCollector = jasmine.createSpyObj("vetoCollector", ["register"]);
        event = test.TestHelper.createMockEvent();
        router = jasmine.createSpyObj("router", [ "attachRoutePatternMatched", "navTo", "attachRouteMatched" ]);
        component = jasmine.createSpyObj("component", [ "getCsrfToken", "getModel", "getNavigationVetoCollector" ]);
        component.getNavigationVetoCollector.and.returnValue(vetoCollector);
        spyOn(libUnderTest, "getComponent").and.returnValue(component);
        resourceBundle = test.TestHelper.createMockResourceBundle();
        model = test.TestHelper.createMockModel();
        model.getResourceBundle.and.returnValue(resourceBundle);
        sap.ui.Device.system.phone = false;
        spyOn(libUnderTest, "getView").and.returnValue(view);
    });
    it("onInit", function () {
        view.byId.and.returnValue(control);
        libUnderTest.onInit.call(libUnderTest);
        expect(libUnderTest.oDataModel).not.toBeUndefined();
        expect(libUnderTest.oFilterKeys).not.toBeUndefined();
        expect(libUnderTest.graph).toBe(control);
    });
    
    it("setAlertFilters with empty filters", function() {
        view.getModel.and.returnValue(model);
        spyOn(sap.ui.core.BusyIndicator, "show");
        libUnderTest.oDataModel = model;
        libUnderTest.graph = jasmine.createSpyObj("graph", ["clear"]);
        libUnderTest.setAlertFilters.call(libUnderTest, []);
        expect(model.read).toHaveBeenCalled();
        expect(libUnderTest.graph.clear).toHaveBeenCalled();
        expect(model.read.calls.argsFor(0)[1].filters).toEqual([]);
        expect(sap.ui.core.BusyIndicator.show).toHaveBeenCalled();
    });

    it("setAlertFilters with non empty filters", function() {
        view.getModel.and.returnValue(model);
        spyOn(sap.ui.core.BusyIndicator, "show");
        libUnderTest.oDataModel = model;
        libUnderTest.graph = jasmine.createSpyObj("graph", ["clear"]);
        libUnderTest.setAlertFilters.call(libUnderTest, [new sap.ui.model.Filter({path : "Path", operator : "EQ", value1 : "Test"})]);
        expect(model.read).toHaveBeenCalled();
        expect(libUnderTest.graph.clear).toHaveBeenCalled();
        expect(model.read.calls.argsFor(0)[1].filters).not.toEqual([]);
        expect(model.read.calls.argsFor(0)[1].filters.length).toBe(1);
        expect(model.read.calls.argsFor(0)[1].filters[0].sPath).toBe("Path");
        expect(model.read.calls.argsFor(0)[1].filters[0].sOperator).toBe("EQ");
        expect(model.read.calls.argsFor(0)[1].filters[0].oValue1).toBe("Test");
        expect(sap.ui.core.BusyIndicator.show).toHaveBeenCalled();
    });
    it("setAlertFilters calling success handler and no filters", function() {
        view.getModel.and.returnValue(model);
        spyOn(sap.ui.core.BusyIndicator, "show");
        spyOn(sap.ui.core.BusyIndicator, "hide");
        libUnderTest.oDataModel = model;
        libUnderTest.graph = jasmine.createSpyObj("graph", ["clear", "setAlertData", "setFilterKeys", "setAlertFilter", "createGraphData"]);
        libUnderTest.setAlertFilters.call(libUnderTest, []);
        
        expect(function(){model.read.calls.argsFor(0)[1].success.call(libUnderTest,{results : []})}).not.toThrow();
        expect(sap.ui.core.BusyIndicator.hide).toHaveBeenCalled();
        expect(libUnderTest.graph.setAlertData).toHaveBeenCalled();
        expect(libUnderTest.graph.setFilterKeys).toHaveBeenCalled();
        expect(libUnderTest.graph.setAlertFilter).toHaveBeenCalled();
        expect(libUnderTest.graph.createGraphData).toHaveBeenCalled();
        expect(libUnderTest.graph.setAlertFilter.calls.argsFor(0)[0].length).toBe(0);
        expect(sap.ui.core.BusyIndicator.show).toHaveBeenCalled();
    });
    it("setAlertFilters calling success handler and supported filters", function() {
        view.getModel.and.returnValue(model);
        spyOn(sap.ui.core.BusyIndicator, "show");
        spyOn(sap.ui.core.BusyIndicator, "hide");
        libUnderTest.oDataModel = model;
        libUnderTest.graph = jasmine.createSpyObj("graph", ["clear", "setAlertData", "setFilterKeys", "setAlertFilter", "createGraphData"]);
        libUnderTest.setAlertFilters.call(libUnderTest, [new sap.ui.model.Filter({path : "AlertStatus", operator : "EQ", value1 : "Test"})]);
        
        expect(function(){model.read.calls.argsFor(0)[1].success.call(libUnderTest,{results : []})}).not.toThrow();
        expect(sap.ui.core.BusyIndicator.hide).toHaveBeenCalled();
        expect(libUnderTest.graph.setAlertData).toHaveBeenCalled();
        expect(libUnderTest.graph.setFilterKeys).toHaveBeenCalled();
        expect(libUnderTest.graph.setAlertFilter).toHaveBeenCalled();
        expect(libUnderTest.graph.setAlertFilter.calls.argsFor(0)[0].length).toBe(1);
        expect(libUnderTest.graph.createGraphData).toHaveBeenCalled();
        expect(sap.ui.core.BusyIndicator.show).toHaveBeenCalled();
        
    });
    it("setAlertFilters calling success handler and unsupported filters", function() {
        view.getModel.and.returnValue(model);
        spyOn(sap.ui.core.BusyIndicator, "show");
        spyOn(sap.ui.core.BusyIndicator, "hide");
        libUnderTest.oDataModel = model;
        libUnderTest.graph = jasmine.createSpyObj("graph", ["clear", "setAlertData", "setFilterKeys", "setAlertFilter", "createGraphData"]);
        libUnderTest.setAlertFilters.call(libUnderTest, [new sap.ui.model.Filter({path : "Path", operator : "EQ", value1 : "Test"})]);
        
        expect(function(){model.read.calls.argsFor(0)[1].success.call(libUnderTest,{results : []})}).not.toThrow();
        expect(sap.ui.core.BusyIndicator.hide).toHaveBeenCalled();
        expect(libUnderTest.graph.setAlertData).toHaveBeenCalled();
        expect(libUnderTest.graph.setFilterKeys).toHaveBeenCalled();
        expect(libUnderTest.graph.setAlertFilter).toHaveBeenCalled();
        expect(libUnderTest.graph.setAlertFilter.calls.argsFor(0)[0].length).toBe(0);
        expect(libUnderTest.graph.createGraphData).toHaveBeenCalled();
        expect(sap.ui.core.BusyIndicator.show).toHaveBeenCalled();
        
    });
   it("setAlertFilters calling error handler", function() {
        view.getModel.and.returnValue(model);
        spyOn(sap.ui.core.BusyIndicator, "show");
        spyOn(sap.ui.core.BusyIndicator, "hide");
        spyOn(sap.m.MessageBox, "alert");
        libUnderTest.oDataModel = model;
        component.getModel.and.returnValue(model);
        libUnderTest.graph = jasmine.createSpyObj("graph", ["clear", "setAlertData", "setFilterKeys", "setAlertFilter", "createGraphData"]);
       libUnderTest.setAlertFilters.call(libUnderTest, []);
        expect(model.read.calls.argsFor(0)[1].error).not.toThrow();
        expect(sap.ui.core.BusyIndicator.hide).toHaveBeenCalled();
        expect(sap.m.MessageBox.alert).toHaveBeenCalled();
        expect(sap.ui.core.BusyIndicator.show).toHaveBeenCalled();
    });

 });