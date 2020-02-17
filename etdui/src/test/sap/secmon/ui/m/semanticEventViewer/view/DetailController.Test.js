describe("SemanticEventsDetail.controller Tests", function () {
    // jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
    jQuery.sap.require({
        modName : "sap.secmon.ui.m.semanticEventViewer.view.Detail",
        type : "controller"
    });

    var libUnderTest;
    var view, dialog, parentView, errorHandler, bindingContext, router, uicomponent, event, namespaceSelect, component, model, control,
        controllerHelper, column, vetoCollector;
    afterEach(function () {
    });
    beforeEach(function () {
        libUnderTest = sap.ui.controller("sap.secmon.ui.m.semanticEventViewer.view.Detail");
        view = jasmine.createSpyObj("view", [ "setModel", "byId", "addStyleClass", "getModel", "getController", "getId", "addDependent", "getBindingContext" ]);
        control = jasmine.createSpyObj("control", [ "setValueState", "getSelected", "setValue", "setText", "setVisible", "getVisible", "getColumns", "bindItems", "getBinding" ]);
        dialog = jasmine.createSpyObj("dialog", [ "setModel", "open", "close", "focus", "getModel", "getParent" ]);
        parentView = jasmine.createSpyObj("parentView", [ "getId", "addDependent", "getModel", "byId", "getBindingContext", "getController" ]);
        bindingContext = jasmine.createSpyObj("bindingContext", [ "getProperty", "getObject" ]);
        vetoCollector = jasmine.createSpyObj("vetoCollector", ["register"]);
        column = jasmine.createSpyObj("column", ["getSortProperty", "setSorted", "setSortOrder"]);
        spyOn(libUnderTest, "getView").and.returnValue(view);
        dialog.getParent.and.returnValue(view);
        event = jasmine.createSpyObj("event", [ "getParameter", "getSource" ]);
        namespaceSelect = jasmine.createSpyObj("namespaceSelect", [ "removeItem", "bindAggregation", "getSelectedItem" ]);
        router = jasmine.createSpyObj("router", [ "attachRoutePatternMatched", "navTo", "attachRouteMatched" ]);
        component = jasmine.createSpyObj("component", [ "getCsrfToken", "getModel","getNavigationVetoCollector" ]);
        component.getNavigationVetoCollector.and.returnValue(vetoCollector);
        spyOn(libUnderTest, "getComponent").and.returnValue(component);
        uicomponent = jasmine.createSpyObj("uicomponent", [ "getRouterFor" ]);
        model = jasmine.createSpyObj("model", [ "getData", "setData", "getServiceMetadata" ]);
        controllerHelper = jasmine.createSpyObj("controllerHelper", ["getFilterInputIdsOfFilterBar", 
            "getTemplate"]);
        spyOn(sap.ui.core.UIComponent, "getRouterFor").and.returnValue(router);
        sap.ui.Device.system.phone = false;
        spyOn(sap.ui, "xmlfragment").and.returnValue(dialog);
      

    });
    it("constructor Test", function () {
        expect(libUnderTest.oCommons).not.toBeUndefined();
    });
    it("onInit", function () {
        libUnderTest.onInit.call(libUnderTest);
        expect(view.setModel).toHaveBeenCalled();
         expect(libUnderTest.oInvestigationAddendum).not.toBeUndefined();
         expect(vetoCollector.register).toHaveBeenCalled();
    });
    it("handleAddToInvestigationPressed with no event selected", function() {
        view.getBindingContext.and.returnValue();
        bindingContext.getObject.and.returnValue({});
        libUnderTest.oInvestigationAddendum = jasmine.createSpyObj("oInvestigationAddendum",["showGeneralInvestigationAddendumDialog"]);
        
        libUnderTest.handleAddToInvestigationPressed(event);
        expect(libUnderTest.oInvestigationAddendum.showGeneralInvestigationAddendumDialog).not.toHaveBeenCalled();
     });
     it("handleAddToInvestigationPressed with a event selected", function() {
         view.getBindingContext.and.returnValue(bindingContext);
         bindingContext.getObject.and.returnValue({Id : '1234'});
         libUnderTest.oInvestigationAddendum = jasmine.createSpyObj("oInvestigationAddendum",["showGeneralInvestigationAddendumDialog"]);
               
         libUnderTest.handleAddToInvestigationPressed(event);
         expect(libUnderTest.oInvestigationAddendum.showGeneralInvestigationAddendumDialog).toHaveBeenCalled();
      });

 });