describe("Investigation.controller Tests", function () {
    // jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
    jQuery.sap.require({
        modName : "sap.secmon.ui.m.invest.view.Master",
        type : "controller"
    });
    jQuery.sap.require("test.TestHelper");
    var libUnderTest;
    var view, dialog, parentView, errorHandler, bindingContext, router, uicomponent, event, namespaceSelect, component, model, control,
        controllerHelper, column, splitter, table,tableScrollContainer, layoutData, binding, queryExtractor, vetoCollector, headerPanel,
        iconTabBar, comments, changes;
    afterEach(function () {
    });
    beforeEach(function () {
        libUnderTest = sap.ui.controller("sap.secmon.ui.m.invest.view.Detail");
        view = test.TestHelper.createMockView();
        control =test.TestHelper.createMockControl();
        
        
        parentView = test.TestHelper.createMockView();
        dialog = test.TestHelper.createMockDialog(view);
        bindingContext = test.TestHelper.createMockBindingContext();
        splitter = jasmine.createSpyObj("splitter", ["getContentAreas", "addContentArea", "removeContentArea"]);
        tableScrollContainer = jasmine.createSpyObj("tableScrollContainer", ["getLayoutData"]);
        column = jasmine.createSpyObj("column", ["getSortProperty", "setSorted", "setSortOrder"]);
        table = jasmine.createSpyObj("table", ["getColumns", "bindItems", "getBinding"]);
        comments = jasmine.createSpyObj("comments", ["getBinding"]);
        changes = jasmine.createSpyObj("changes", ["getBinding"]);
        binding = jasmine.createSpyObj("binding", ["attachDataReceived", "filter"]);
        layoutData = jasmine.createSpyObj("layoutData",["setSize"]);
        vetoCollector = jasmine.createSpyObj("vetoCollector", ["noVetoExists", "register"]);
        queryExtractor = jasmine.createSpyObj("queryExtractor", ["extractFilters", "extractSorter"]);
        spyOn(libUnderTest, "getView").and.returnValue(view);
        headerPanel = jasmine.createSpyObj("headerPanel", ["insertContent", "getBindingContext", "removeContent", "destroy"]);
        iconTabBar = jasmine.createSpyObj("iconTabBar", ["getItems", "getSelectedKey", "setSelectedKey"]);
        event = test.TestHelper.createMockEvent();
        namespaceSelect = jasmine.createSpyObj("namespaceSelect", [ "removeItem", "bindAggregation", "getSelectedItem" ]);
        router = test.TestHelper.createMockRouter();
        component = jasmine.createSpyObj("component", [ "getCsrfToken", "getModel", "getNavigationVetoCollector" ]);
        component.getNavigationVetoCollector.and.returnValue(vetoCollector);
        spyOn(libUnderTest, "getComponent").and.returnValue(component);
        uicomponent = jasmine.createSpyObj("uicomponent", [ "getRouterFor" ]);
        model = test.TestHelper.createMockModel();
        controllerHelper = jasmine.createSpyObj("controllerHelper", ["getFilterInputIdsOfFilterBar", 
            "getTemplate"]);
        spyOn(sap.ui.core.UIComponent, "getRouterFor").and.returnValue(router);
        sap.ui.Device.system.phone = false;
        spyOn(sap.ui, "xmlfragment").and.returnValue(dialog);
      

    });
    it("constructor Test", function () {
        expect(libUnderTest.oCommons).not.toBeUndefined();
        expect(libUnderTest.editModel).not.toBeUndefined();
        expect(libUnderTest.compactDetailsModel).not.toBeUndefined();
    });
    it("onInit with check for attachRouteMatched without parameters", function () {
        view.byId.and.returnValue(headerPanel);
        view.getModel.and.returnValue(model);
        libUnderTest.onInit.call(libUnderTest);
        expect(libUnderTest.editModel).not.toBe(null);
        expect(vetoCollector.register).toHaveBeenCalled();
        expect(router.attachRouteMatched).toHaveBeenCalled();
        router.attachRouteMatched.calls.argsFor(0)[0](event);
        expect(model.setSizeLimit).toHaveBeenCalledWith(1000);
    });
    it("onInit with check for attachRouteMatched with parameters", function () {
        event.getParameter.and.callFake(function(x) {
            switch(x) {
            case "name" : return "investigation";
            case "arguments" : return {investigation : 4711 , "?query" : undefined};
            }
        });
        view.byId.and.callFake(function(id) {
            switch(id) {
            case "headerPanel" : return headerPanel;
            case "investigationDetailsContainer" : return control;
            case "idIconTabBar" : return iconTabBar;
            case "changes" : return changes;
            case "comments" : return comments;
            }
        });
        comments.getBinding.and.returnValue(binding);
        changes.getBinding.and.returnValue(binding);
        view.getBindingContext.and.returnValue(bindingContext);
        view.getElementBinding.and.returnValue(binding);
        view.getModel.and.returnValue(model);
        libUnderTest.onInit.call(libUnderTest);
        expect(libUnderTest.editModel).not.toBe(null);
        expect(vetoCollector.register).toHaveBeenCalled();
        expect(router.attachRouteMatched).toHaveBeenCalled();
        router.attachRouteMatched.calls.argsFor(0)[0].call(libUnderTest,event);
        expect(model.setSizeLimit).toHaveBeenCalledWith(1000);
    });
    
    it("onStartEventJob", function() {
        event.getSource.and.returnValue(control);
        
        libUnderTest.eventsJobModel = new sap.ui.model.json.JSONModel({
            eventsJobNotStarted : true
        });
        control.getBindingContext.and.returnValue(bindingContext);
        bindingContext.getProperty.and.returnValue(libUnderTest.oCommons.hexToBase64("1122334455"));
        spyOn(sap.m.MessageToast,"show");
        spyOn($, "ajax");
        libUnderTest.onStartEventsJob(event);
        expect($.ajax).toHaveBeenCalled();
        expect(libUnderTest.eventsJobModel.getData().eventsJobNotStarted).toBeFalsy();
    });
    it("handleDownloadEvent", function() {
        event.getSource.and.returnValue(control);
        view.getModel.and.returnValue(model);
        model.getData.and.returnValue({Id : libUnderTest.oCommons.hexToBase64("1122334455")})
        control.getBindingContext.and.returnValue(bindingContext);
        bindingContext.getProperty.and.returnValue(libUnderTest.oCommons.hexToBase64("1122334455"));
        spyOn($, "ajax");
        spyOn(sap.ui.core.BusyIndicator, "show");
        spyOn(sap.ui.core.BusyIndicator, "hide");
        libUnderTest.handleDownloadEvents(event);
        expect($.ajax).toHaveBeenCalled();
    });
    describe("handleClickEvents", function() {
        beforeEach(function() {
            spyOn(sap.secmon.ui.m.invest.view.InvestigationObjectHelper, "handlePatternWorkspaceClicked");
            spyOn(sap.secmon.ui.m.invest.view.InvestigationObjectHelper,"onTriggeringEventsClicked")
            spyOn(sap.secmon.ui.m.invest.view.InvestigationObjectHelper,"updateRelatedEventCount");
            spyOn(sap.secmon.ui.m.invest.view.InvestigationObjectHelper,"onRelatedEventsClicked");
            spyOn(sap.secmon.ui.m.invest.view.InvestigationObjectHelper,"onSystemTriggerPress");
            
        });
        
        it("handlePatternWorkspaceClicked", function() {
           libUnderTest.handlePatternWorkspaceClicked(event);
           expect(sap.secmon.ui.m.invest.view.InvestigationObjectHelper.handlePatternWorkspaceClicked).toHaveBeenCalled();
        });
        it("onTriggeringEventsClicked", function() {
            libUnderTest.onTriggeringEventsClicked(event);
            expect( sap.secmon.ui.m.invest.view.InvestigationObjectHelper.onTriggeringEventsClicked).toHaveBeenCalled();
        });
        it("updateRelatedEventCount", function() {
            libUnderTest.updateRelatedEventCount(event);
            expect( sap.secmon.ui.m.invest.view.InvestigationObjectHelper.updateRelatedEventCount).toHaveBeenCalled();
        });
        it("onRelatedEventsClicked", function() {
            libUnderTest.onRelatedEventsClicked(event);
            expect(sap.secmon.ui.m.invest.view.InvestigationObjectHelper.onRelatedEventsClicked).toHaveBeenCalled();
        });
        it("onDetailsPress", function() {
           libUnderTest.onDetailsPress(event);
           expect(sap.secmon.ui.m.invest.view.InvestigationObjectHelper.onSystemTriggerPress).toHaveBeenCalled();
        });
    });
    describe("handleTableRowSelectionChange", function() {
        var layout, content, investigationContentHelper;
        beforeEach(function() {
            content = [];
            layout = jasmine.createSpyObj("layout", ["getContentAreas", "removeContentArea"]);
            view.byId.and.returnValue(layout);
            layout.getContentAreas.and.returnValue(content);
            event.getParameter.and.returnValue(control);
            control.getBindingContext.and.returnValue(bindingContext);
            spyOn(sap.secmon.ui.m.invest.view.InvestigationObjectHelper, "handleAlertRowSelection");
            spyOn(sap.secmon.ui.m.invest.view.InvestigationObjectHelper,"handleEventRowSelection")
            spyOn(sap.secmon.ui.m.invest.view.InvestigationObjectHelper,"handleHealthCheckRowSelection");
            spyOn(sap.secmon.ui.m.invest.view.InvestigationObjectHelper,"handleFSpaceCheckRowSelection");
            
        });
        it("handleTableRowSelectionChange with ObjectType ALERT", function() {           
            bindingContext.getObject.and.returnValue({ObjectType : "ALERT"});
            libUnderTest.handleTableRowSelectionChange(event);
            expect(layout.removeContentArea).not.toHaveBeenCalled();
            expect(sap.secmon.ui.m.invest.view.InvestigationObjectHelper.handleAlertRowSelection).toHaveBeenCalled();
        });
        it("handleTableRowSelectionChange with ObjectType EVENT", function() {           
            bindingContext.getObject.and.returnValue({ObjectType : "EVENT"});
            libUnderTest.handleTableRowSelectionChange(event);
            expect(layout.removeContentArea).not.toHaveBeenCalled();
            expect(sap.secmon.ui.m.invest.view.InvestigationObjectHelper.handleEventRowSelection).toHaveBeenCalled();
        });
        it("handleTableRowSelectionChange with ObjectType HEALTHCHECK", function() {           
            bindingContext.getObject.and.returnValue({ObjectType : "HEALTHCHECK"});
            libUnderTest.handleTableRowSelectionChange(event);
            expect(layout.removeContentArea).not.toHaveBeenCalled();
            expect(sap.secmon.ui.m.invest.view.InvestigationObjectHelper.handleHealthCheckRowSelection).toHaveBeenCalled();
        });
        it("handleTableRowSelectionChange with ObjectType FSPACE", function() {           
            bindingContext.getObject.and.returnValue({ObjectType : "FSPACE"});
            libUnderTest.handleTableRowSelectionChange(event);
            expect(layout.removeContentArea).not.toHaveBeenCalled();
            expect(sap.secmon.ui.m.invest.view.InvestigationObjectHelper.handleFSpaceCheckRowSelection).toHaveBeenCalled();
        });
        it("handleTableRowSelectionChange with ObjectType FSPACE and existing content", function() {
            content.push(control);
            content.push(control);
            bindingContext.getObject.and.returnValue({ObjectType : "FSPACE"});
            libUnderTest.handleTableRowSelectionChange(event);
            expect(layout.removeContentArea).toHaveBeenCalled();
            expect(sap.secmon.ui.m.invest.view.InvestigationObjectHelper.handleFSpaceCheckRowSelection).toHaveBeenCalled();
        });
        
   });
    
});
