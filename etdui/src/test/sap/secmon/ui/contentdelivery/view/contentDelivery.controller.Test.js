describe("contentDelivery.controller.js test", function () {
    // jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
    jQuery.sap.require({
        modName : "sap.secmon.ui.contentdelivery.view.contentDelivery",
        type : "controller"
    });
    jQuery.sap.require("test.TestHelper");
    var libUnderTest;
    var view, dialog, parentView, errorHandler, bindingContext, router, uicomponent, event, namespaceSelect, component, model, control,
        controllerHelper, column, vetoCollector, resourceBundle;
    router = jasmine.createSpyObj("router", [ "attachRoutePatternMatched", "navTo", "attachRouteMatched" ]);
    component = jasmine.createSpyObj("component", [ "getCsrfToken", "getModel", "getNavigationVetoCollector" ]);

    afterEach(function () {
    });
    beforeEach(function () {
        spyOn(sap.ui.core.UIComponent, "getRouterFor").and.returnValue(router);
        libUnderTest = sap.ui.controller("sap.secmon.ui.contentdelivery.view.contentDelivery");
        spyOn(libUnderTest, "getComponent").and.returnValue(component);
        model = test.TestHelper.createMockModel();
        control = jasmine.createSpyObj("control", [ "setValueState", "getSelected", "setValue", "setText", "setVisible", "getVisible", "getColumns", "bindItems", "getBinding" ]);
        view = test.TestHelper.createMockView();
        view.createId.and.callFake(function(x) {return x;});
        bindingContext = test.TestHelper.createMockBindingContext();
        view.getModel.and.returnValue(model);
        spyOn(libUnderTest, "getView").and.returnValue(view);
    });
    it("onInit", function () {
        view.byId.and.returnValue(control);
        libUnderTest.onInit.call(libUnderTest);
        expect(libUnderTest.oRouter).not.toBeUndefined();
        expect(model.attachRequestCompleted).toHaveBeenCalled();
    });
    describe("checkVersion", function() {
        it("returns false, if version is not contained in list ", function() {
            model.getData.and.returnValue({version : {VERSION : "1", VERSION_SP : "6", VERSION_PATCH : "0"}});
           
            expect(libUnderTest.checkVersion([["1.7.0", "1.8.0"]])).toBeFalsy();
        });
        it("returns true, if version is contained in list ", function() {
            model.getData.and.returnValue({version : {VERSION : "1", VERSION_SP : "6", VERSION_PATCH : "0"}});
           
            expect(libUnderTest.checkVersion([["1.6.0"]])).toBeTruthy();
        });
   });
   
 });