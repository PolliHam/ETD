describe("EtdMaster.controller Tests", function () {
    // jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
    jQuery.sap.require({
        modName : "sap.secmon.ui.m.commons.EtdMasterController",
    });
    jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");

    var libUnderTest;
    var view, dialog, parentView, errorHandler, bindingContext, router, uicomponent, namespaceSelect, component, model, control,
        controllerHelper, column;
    afterEach(function () {
    });
    beforeEach(function () {
        libUnderTest = oController = sap.ui.controller("sap.secmon.ui.m.commons.EtdMasterController");
        view = jasmine.createSpyObj("view", [ "setModel", "byId", "addStyleClass", "getModel", "getController", "getId", "addDependent" ]);
        control = jasmine.createSpyObj("control", [ "setValueState", "getSelected", "setValue", 
                  "setText", "setVisible", "getVisible", "getColumns", "bindItems", "getBinding", 
                  "attachEventOnce", "attachEvent" ]);
        bindingContext = jasmine.createSpyObj("bindingContext", [ "getProperty" ]);
        column = jasmine.createSpyObj("column", ["getSortProperty", "setSorted", "setSortOrder"]);
        spyOn(libUnderTest, "getView").and.returnValue(view);
       
        event = jasmine.createSpyObj("event", [ "getParameter", "getSource" ]);
        namespaceSelect = jasmine.createSpyObj("namespaceSelect", [ "removeItem", "bindAggregation", "getSelectedItem" ]);
        router = jasmine.createSpyObj("router", [ "attachRoutePatternMatched", "navTo", "attachRouteMatched" ]);
        component = jasmine.createSpyObj("component", [ "getCsrfToken", "getModel" ]);
        //uicomponent = jasmine.createSpyObj("uicomponent", [ "getRouterFor" ]);
        model = jasmine.createSpyObj("model", [ "getData", "setData", "getServiceMetadata" ]);
        controllerHelper = jasmine.createSpyObj("controllerHelper", ["getFilterInputIdsOfFilterBar", 
            "getTemplate"]);
        spyOn(sap.ui.core.UIComponent, "getRouterFor").and.returnValue(router);
        sap.ui.Device.system.phone = false;
        spyOn(sap.ui, "xmlfragment").and.returnValue(dialog);
        view.byId.and.returnValue(control);
        var testComp = sap.secmon.ui.m.commons.EtdComponent.extend("test.sap.secmon.ui.commons.m.EtdComponentTest", {
            metadata : {
                config : {
                    resourceBundle : "/main/sap/secmon/ui/m/valuelist/i18n/UIText.hdbtextbundle"
                }
            }
        });
        var comp = new testComp();
        spyOn(libUnderTest, "getComponent").and.returnValue(comp);
      

    });
    it("constructor Test", function () {
        expect(libUnderTest.oCommons).not.toBeUndefined();
    });
    it("onInit without configuration", function () {
        expect(function() {libUnderTest.init();}).toThrow();
    });
    it("onInit with configuration null", function() {
        expect(function() {libUnderTest.init(null);}).toThrow();
    });
    it("onInit with invalid object", function() {
        expect(function() {libUnderTest.init({});}).toThrow();
    });
    it("onInit with invalid entityName", function() {
        expect(function() {libUnderTest.init({entityName : 2});}).toThrow();
    });
    it("onInit with invalid listControlId", function() {
        expect(function() {libUnderTest.init({entityName : "2", listControlId : 2});}).toThrow();
    });
    it("onInit with invalid searchProperty", function() {
        expect(function() {libUnderTest.init({entityName : "2", listControlId : "4711", searchProperty : []});}).toThrow();
    });
    it("onInit with valid object", function() {
        expect(function() {libUnderTest.init({entityName : "2", listControlId : "4711", searchProperty : "ABC"});}).not.toThrow();
        expect(control.attachEvent).toHaveBeenCalled();
        expect(control.attachEventOnce).toHaveBeenCalled();
    });
    it("onRouteMatched with no arguments", function() {
        event.getParameter.and.callFake(function(param) {
            switch(param) {
            case "name":
                return "Name";
            case "arguments":
                return null;
            }
        });
        spyOn(libUnderTest, "getList");
        libUnderTest.onRouteMatched(event);
        expect(libUnderTest.getList).not.toHaveBeenCalled();     
    });
    it("onRouteMatched with any arguemnt", function() {
        event.getParameter.and.callFake(function(param) {
            switch(param) {
            case "name":
                return "Name";
            case "arguments":
                return "arg";
            }
        });
        spyOn(libUnderTest, "getList");
        spyOn(libUnderTest, "selectFirstListItem");
        libUnderTest.onRouteMatched(event);
        expect(libUnderTest.getList).toHaveBeenCalled();
        expect(libUnderTest.selectFirstListItem).not.toHaveBeenCalled();
    });
   
    it("onRouteMatched with argument equal entity name", function() {
        event.getParameter.and.callFake(function(param) {
            switch(param) {
            case "name":
                return "main";
            case "arguments":
                return {"blub" :2 };
            }
        });
        libUnderTest.entityName = "blub";
        spyOn(libUnderTest, "getList");
        spyOn(libUnderTest, "selectFirstListItem");
        libUnderTest.onRouteMatched(event);
        expect(libUnderTest.getList).toHaveBeenCalled();
        expect(libUnderTest.selectFirstListItem).not.toHaveBeenCalled();
    });
    it("onRouteMatched with argument not equal entity name", function() {
        event.getParameter.and.callFake(function(param) {
            switch(param) {
            case "name":
                return "main";
            case "arguments":
                return { };
            }
        });
        libUnderTest.entityName = "blub";
        spyOn(libUnderTest, "getList");
        spyOn(libUnderTest, "selectFirstListItem");
        libUnderTest.onRouteMatched(event);
        expect(libUnderTest.getList).toHaveBeenCalled();
        expect(libUnderTest.selectFirstListItem).toHaveBeenCalled();
    });
     
  });
