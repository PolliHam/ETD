describe("SemanticEvents.controller Tests", function () {

    // jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
    jQuery.sap.require({
        modName : "sap.secmon.ui.m.semanticEventFS.view.SemanticEvents",
        type : "controller"
    });
    jQuery.sap.require("test.TestHelper");
    jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");

    var libUnderTest;
    var view, dialog, parentView, errorHandler, bindingContext, router, uicomponent, event, namespaceSelect, component, model, control,
        controllerHelper, column, splitter, table,tableScrollContainer, layoutData, binding, resourceBundle;
    afterEach(function () {
    });
    beforeEach(function () {
        libUnderTest = sap.ui.controller("sap.secmon.ui.m.semanticEventFS.view.SemanticEvents");

        view = test.TestHelper.createMockView();
        control = test.TestHelper.createMockControl();
        dialog = test.TestHelper.createMockDialog();
        parentView =  test.TestHelper.createMockView();
        bindingContext = test.TestHelper.createMockBindingContext();
        splitter = jasmine.createSpyObj("splitter", ["getContentAreas", "addContentArea", "removeContentArea"]);
        tableScrollContainer = jasmine.createSpyObj("tableScrollContainer", ["getLayoutData"]);
        column = jasmine.createSpyObj("column", ["getSortProperty", "setSorted", "setSortOrder"]);
        table = jasmine.createSpyObj("table", ["getSelectedContextPaths", "getModel", "getColumns", "bindItems", "getBinding", "attachSelectionChange", "attachUpdateFinished"]);
        binding = jasmine.createSpyObj("binding", ["attachDataReceived"]);
        layoutData = jasmine.createSpyObj("layoutData",["setSize"]);
        spyOn(libUnderTest, "getView").and.returnValue(view);
        dialog.getParent.and.returnValue(view);
        event = test.TestHelper.createMockEvent();
        namespaceSelect = jasmine.createSpyObj("namespaceSelect", [ "removeItem", "bindAggregation", "getSelectedItem" ]);
        router = test.TestHelper.createMockRouter();
        component = test.TestHelper.createMockComponent( [ "getCsrfToken", "getModel", "getNavigationVetoCollector", "callPseudoODataService" ]);
        spyOn(libUnderTest, "getComponent").and.returnValue(component);
        uicomponent = jasmine.createSpyObj("uicomponent", [ "getRouterFor" ]);
        model = test.TestHelper.createMockModel();
        table.getModel.and.returnValue(model);
        resourceBundle = test.TestHelper.createMockResourceBundle();
        model.getResourceBundle.and.returnValue(resourceBundle);
        controllerHelper = jasmine.createSpyObj("controllerHelper", ["getFilterInputIdsOfFilterBar",
            "getTemplate"]);
        spyOn(sap.ui.core.UIComponent, "getRouterFor").and.returnValue(router);
        sap.ui.Device.system.phone = false;
        spyOn(sap.ui, "xmlfragment").and.returnValue(dialog);
    });

    function setApplicationModel(oView) {
        var oModel = {};
        oModel.getData = function() {
            return {UTC:false};
        };
        oView.getModel.and.callFake(function() {
          return oModel;
        });
    }

    it("constructor Test", function () {
        expect(libUnderTest.oCommons).not.toBeUndefined();
    });
    it("onInit", function () {
        view.byId.and.callFake(function(id) {
            switch(id) {
            case "semanticEventsTable":
                return table;
            default:
                return control;
            }
        });

        var oModel = {};
        var _oModel = {};
        oModel.getData = function() {
            return {
                UTC : false
            };
        };

        _oModel.getData = function(){
            return {
                backButtonVisible : true,
                deleteButtonVisible : true,
                addButtonVisible : false,
                columnItemsType : "Inactive"
            };
        };
        _oModel.setData = function(){};

        component.getModel.and.callFake(function() {
            return oModel;
        });

        view.getModel.and.callFake(function() {
            return _oModel;
        });
        libUnderTest.onInit.call(libUnderTest);
        expect(view.setModel).toHaveBeenCalled();
        expect(libUnderTest.oBookmarkCreator).not.toBeUndefined();
        expect(libUnderTest.controllerHelper).not.toBeUndefined();
        expect(libUnderTest.routeName).toEqual("main");
        expect(libUnderTest.oInvestigationAddendum).not.toBeUndefined();
    });
    it("onRouteMatched do not route", function () {
        view.byId.and.returnValue(control);
        event.getParameter.and.returnValue("main");
        libUnderTest.doNotHandleRouteMatching = true;
        expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
        expect(libUnderTest.doNotHandleRouteMatching).toBeUndefined();
        expect(router.navTo).not.toHaveBeenCalled();
    });
    it("onRouteMatched route to main", function () {
        view.byId.and.returnValue(control);
        event.getParameter.and.returnValue("main");

        expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
        expect(libUnderTest.getRouteName()).toEqual("main");
        expect(router.navTo).toHaveBeenCalled();

    });
    it("onRouteMatched not matching route", function () {
        view.byId.and.returnValue(control);
        event.getParameter.and.returnValue("bla");

        expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
        expect(libUnderTest.getRouteName()).toEqual("bla");
        expect(router.navTo).not.toHaveBeenCalled();

    });
    it("onRouteMatched with query parameters", function () {

        component.getModel.and.returnValue(model);
        model.getServiceMetadata.and.returnValue({dataServices : { schema : [], entityType : []}});
        view.byId.and.returnValue(control);
        control.getColumns.and.returnValue([column]);
        libUnderTest.controllerHelper = controllerHelper;
        spyOn(libUnderTest, "getText").and.returnValue("Test");
        spyOn(libUnderTest, "applyFiltersAndSorter");
        control.getBinding.and.returnValue(binding);
        view.byId.and.returnValue(control);
        var event = jasmine.createSpyObj("event", [ "getParameter" ]);
        event.getParameter.and.callFake(function (x) {
            switch (x) {
            case "name":
                return "main";
            case "arguments":
                return {
                    "?query" : {SystemIdActor : "YI3"}
                };
            }
        });
        setApplicationModel(view);

        expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
        expect(libUnderTest.getRouteName()).toEqual("main");
        expect(libUnderTest.applyFiltersAndSorter).toHaveBeenCalled();
    });

    it("getDateTimeHandler", function () {
        view.byId.and.returnValue(control);
        setApplicationModel(view);
        expect(libUnderTest.getDateTimeHandler.call(libUnderTest)).not.toBeUndefined();
        expect(libUnderTest.dateTimeHandler).not.toBeUndefined();
        var dateTimehandler = libUnderTest.dateTimeHandler;
        expect(libUnderTest.getDateTimeHandler.call(libUnderTest)).toBe(dateTimehandler);
    });
    it("getCurrentDateTimeFilter active", function () {
        view.byId.and.returnValue(control);
        setApplicationModel(view);
        expect(libUnderTest.getCurrentDateTimeFilter.call(libUnderTest, false)).not.toBeUndefined();
        expect(libUnderTest.dateTimeDirty).toBe(false);

    });
    it("getCurrentDateTimeFilter inactive", function () {
        view.byId.and.returnValue(control);
        setApplicationModel(view);
        var alert = spyOn(sap.m.MessageBox, "alert");
        spyOn(libUnderTest, "getCommonText").and.returnValue("Text");
        expect(libUnderTest.getCurrentDateTimeFilter.call(libUnderTest, true)).not.toBeUndefined();
        expect(libUnderTest.dateTimeDirty).toBe(false);
        expect(alert).toHaveBeenCalled();
    });
    it("getFilterBar", function () {
        view.byId.and.returnValue(control);
        expect(libUnderTest.getFilterBar()).not.toBeUndefined();
        expect(view.byId).toHaveBeenCalledWith("vsdFilterBar");
    });
    it("getSemanticEventsTable", function () {
        view.byId.and.returnValue(control);
        expect(libUnderTest.getSemanticEventsTable()).not.toBeUndefined();
        expect(view.byId).toHaveBeenCalledWith("semanticEventsTable");
    });
    it("getTableScrollContainer", function () {
        view.byId.and.returnValue(control);
        expect(libUnderTest.getTableScrollContainer()).not.toBeUndefined();
        expect(view.byId).toHaveBeenCalledWith("tableScrollContainer");
    });
    it("showFilterBar", function () {
        view.byId.and.returnValue(control);
        libUnderTest.showFilterBar(true);
        expect(control.setVisible).toHaveBeenCalledWith(true);
    });
    it("unshowFilterBar", function () {
        view.byId.and.returnValue(control);
        libUnderTest.showFilterBar(false);
        expect(control.setVisible).toHaveBeenCalledWith(false);
    });
    it("setFilterBarText ", function () {
        view.byId.and.returnValue(control);
        libUnderTest.setFilterBarText("text");
        expect(control.setText).toHaveBeenCalledWith("text");
    });
    it("onExpandServiceColumns", function () {
        view.byId.and.returnValue(control);
        view.getModel.and.returnValue(model);
        var modelData = {
            serviceExpanded : false,
            serviceCollapsed : true
        };
        model.getData.and.returnValue(modelData);
        libUnderTest.onExpandServiceColumns.call(libUnderTest);
        expect(modelData.serviceExpanded).toBe(true);
        expect(control.setVisible.calls.argsFor(0)[0]).toBe(false);
        expect(control.setVisible.calls.argsFor(1)[0]).toBe(true);
        expect(control.setVisible.calls.argsFor(2)[0]).toBe(true);
    });
    it("onCollapseServiceColumns", function () {
        view.byId.and.returnValue(control);
        view.getModel.and.returnValue(model);
        var modelData = {
            serviceExpanded : false,
            serviceCollapsed : true
        };
        model.getData.and.returnValue(modelData);
        libUnderTest.onCollapseServiceColumns.call(libUnderTest);
        expect(modelData.serviceExpanded).toBe(false);
        expect(control.setVisible.calls.argsFor(0)[0]).toBe(true);
        expect(control.setVisible.calls.argsFor(1)[0]).toBe(false);
        expect(control.setVisible.calls.argsFor(2)[0]).toBe(false);
    });
    it("onExpandSystemColumns", function () {
        view.byId.and.returnValue(control);
        view.getModel.and.returnValue(model);
        var modelData = {
            systemExpanded : false,
            systemCollapsed : true
        };
        model.getData.and.returnValue(modelData);
        libUnderTest.onExpandSystemColumns.call(libUnderTest);
        expect(modelData.systemExpanded).toBe(true);
        expect(control.setVisible.calls.argsFor(0)[0]).toBe(false);
        for (i = 1; i < 11; i++) {
            expect(control.setVisible.calls.argsFor(i)[0]).toBe(true);
        }
    });
    it("onCollapseSystemColumns", function () {
        view.byId.and.returnValue(control);
        var i = 1;
        view.getModel.and.returnValue(model);
        var modelData = {
            systemExpanded : false,
            systemCollapsed : true
        };
        model.getData.and.returnValue(modelData);
        libUnderTest.onCollapseSystemColumns.call(libUnderTest);
        expect(modelData.systemExpanded).toBe(false);
        expect(control.setVisible.calls.argsFor(0)[0]).toBe(true);
        for (i = 1; i < 11; i++) {
            expect(control.setVisible.calls.argsFor(i)[0]).toBe(false);
        }

    });
    it("onExpandUserColumns", function () {
        view.byId.and.returnValue(control);
        view.getModel.and.returnValue(model);
        var modelData = {
            userExpanded : false,
            userCollapsed : true
        };
        model.getData.and.returnValue(modelData);
        libUnderTest.onExpandUserColumns.call(libUnderTest);
        expect(modelData.userExpanded).toBe(true);
        expect(control.setVisible.calls.argsFor(0)[0]).toBe(false);
        for (i = 1; i < 5; i++) {
            expect(control.setVisible.calls.argsFor(i)[0]).toBe(true);
        }
    });
    it("onCollapseUserColumns", function () {
        view.byId.and.returnValue(control);
        var i = 1;
        view.getModel.and.returnValue(model);
        var modelData = {
            userExpanded : false,
            userCollapsed : true
        };
        model.getData.and.returnValue(modelData);
        libUnderTest.onCollapseUserColumns.call(libUnderTest);
        expect(modelData.userExpanded).toBe(false);
        expect(control.setVisible.calls.argsFor(0)[0]).toBe(true);
        for (i = 1; i < 5; i++) {
            expect(control.setVisible.calls.argsFor(i)[0]).toBe(false);
        }

    });
    it("syncExpandedCollapseButtons all visible", function () {
        var controlObject = prepareControls([ "User", "System", "Service" ], true);
        var modelData = {
            userExpanded : false,
            userCollapsed : false,
            systemExpanded : false,
            systemCollapsed : false,
            serviceExpanded : false,
            serviceCollapsed : false
        };
        model.getData.and.returnValue(modelData);
        view.getModel.and.returnValue(model);

        view.byId.and.callFake(function(id) {
            switch(id) {
            case "semanticEventsTable":
                return table;
            default:
                if (!controlObject.hasOwnProperty(id)) {
                    controlObject[id] = {
                        control : jasmine.createSpyObj("control", [ "getVisible", "setVisible" ])
                    };
                    controlObject[id].control.getVisible.and.returnValue(true);
                }
                return controlObject[id].control;
            }
        });

        table.getColumns.and.returnValue([]);
        libUnderTest.controllerHelper = controllerHelper;

        libUnderTest.syncExpandCollapseButtons();

        expect(modelData.userExpanded).toBeFalsy();
        expect(modelData.userCollapsed).toBeFalsy();
        expect(modelData.systemExpanded).toBeFalsy();
        expect(modelData.systemCollapsed).toBeFalsy();
        expect(modelData.serviceExpanded).toBeFalsy();
        expect(modelData.serviceCollapsed).toBeFalsy();
    });
    it("syncExpandedCollapseButtons all invisible", function () {
        var controlObject = prepareControls([ "User", "System", "Service" ], false);
        var modelData = {
            userExpanded : false,
            userCollapsed : false,
            systemExpanded : false,
            systemCollapsed : false,
            serviceExpanded : false,
            serviceCollapsed : false
        };
        model.getData.and.returnValue(modelData);
        view.getModel.and.returnValue(model);

        view.byId.and.callFake(function(id) {
            switch(id) {
            case "semanticEventsTable":
                return table;
            default:
                if (!controlObject.hasOwnProperty(id)) {
                    controlObject[id] = {
                        control : jasmine.createSpyObj("control", [ "getVisible", "setVisible" ])
                    };
                    controlObject[id].control.getVisible.and.returnValue(false);
                }
                return controlObject[id].control;
            }
        });

        table.getColumns.and.returnValue([]);
        libUnderTest.controllerHelper = controllerHelper;

        libUnderTest.syncExpandCollapseButtons();

        // this is a mix case
        expect(modelData.userExpanded).toBeFalsy();
        expect(modelData.userCollapsed).toBeFalsy();
        expect(modelData.systemExpanded).toBeFalsy();
        expect(modelData.systemCollapsed).toBeFalsy();
        expect(modelData.serviceExpanded).toBeFalsy();
        expect(modelData.serviceCollapsed).toBeFalsy();
    });
    xit("showDetail with true", function() {
       splitter.getContentAreas.and.returnValue(["1"]);

       tableScrollContainer.getLayoutData.and.returnValue(layoutData);
       view.byId.and.callFake(function(id) {
           switch(id) {
           case "splitter":
               return splitter;
           case "tableScrollContainer":
               return tableScrollContainer;
           }
       })
       libUnderTest.showDetail(true);
       expect(splitter.addContentArea).toHaveBeenCalled();
       expect(layoutData.setSize).toHaveBeenCalledWith("60%");
    });
    it("showDetail with false", function() {
        splitter.getContentAreas.and.returnValue(["1"]);

        tableScrollContainer.getLayoutData.and.returnValue(layoutData);
        view.byId.and.callFake(function(id) {
            switch(id) {
            case "splitter":
                return splitter;
            case "tableScrollContainer":
                return tableScrollContainer;
            }
        });
        libUnderTest.showDetail(false);
        expect(splitter.addContentArea).not.toHaveBeenCalled();
        expect(layoutData.setSize).toHaveBeenCalledWith("100%");
     });
    it("handleBookmarkDialogButtonPressed", function() {
        var dateTimeHandler = jasmine.createSpyObj("dateTimeHandler", ["getSelectionAsObject"]);
        var controllerHelper = jasmine.createSpyObj("controllerHelper", ["getFilterInputIdsOfFilterBar"]);
        var bookmarkCreator = jasmine.createSpyObj("bookmarkCreator", ["showBookmarkCreationDialog"]);
        table.getColumns.and.returnValue([]);
        view.byId.and.returnValue(table);
        component.getModel.and.returnValue(model);
        libUnderTest.controllerHelper = controllerHelper;
        libUnderTest.oBookmarkCreator = bookmarkCreator;
        controllerHelper.getFilterInputIdsOfFilterBar.and.returnValue([]);
        dateTimeHandler.getSelectionAsObject.and.returnValue({});
        libUnderTest.dateTimeHandler = dateTimeHandler;
        libUnderTest.handleBookmarkDialogButtonPressed.call(libUnderTest);
        expect(bookmarkCreator.showBookmarkCreationDialog).toHaveBeenCalled();
    });
    it("handleEmailButtonPressed", function() {
        var dateTimeHandler = jasmine.createSpyObj("dateTimeHandler", ["getSelectionAsObject"]);
        var controllerHelper = jasmine.createSpyObj("controllerHelper", ["getFilterInputIdsOfFilterBar"]);
        var bookmarkCreator = jasmine.createSpyObj("bookmarkCreator", ["showBookmarkCreationDialog"]);
        view.byId.and.returnValue(control);
        spyOn(sap.secmon.ui.m.commons.TileURLUtils, "createURLWithParams");
        component.getModel.and.returnValue(model);
        libUnderTest.controllerHelper = controllerHelper;
        libUnderTest.oBookmarkCreator = bookmarkCreator;
        spyOn(sap.m.URLHelper, "triggerEmail");
        controllerHelper.getFilterInputIdsOfFilterBar.and.returnValue([]);
        dateTimeHandler.getSelectionAsObject.and.returnValue({});
        libUnderTest.dateTimeHandler = dateTimeHandler;
        libUnderTest.handleEmailButtonPressed.call(libUnderTest);
        expect(sap.m.URLHelper.triggerEmail).toHaveBeenCalled();
    });
    it("onAnomalyClicked with context but no id", function() {
        event.getSource.and.returnValue(control);
        control.getBindingContext.and.returnValue(bindingContext);
        spyOn(sap.secmon.ui.m.commons.NavigationService, "openAnomalyDetail");
        bindingContext.getModel.and.returnValue(model);
        libUnderTest.onAnomalyClicked(event);
        expect(sap.secmon.ui.m.commons.NavigationService.openAnomalyDetail).not.toHaveBeenCalled();
    });
    it("onAnomalyClicked with context and id", function() {
        event.getSource.and.returnValue(control);
        control.getBindingContext.and.returnValue(bindingContext);
        spyOn(sap.secmon.ui.m.commons.NavigationService, "openAnomalyDetail");
        bindingContext.getModel.and.returnValue(model);
        model.getProperty.and.returnValue(4711);
        libUnderTest.onAnomalyClicked(event);
        expect(sap.secmon.ui.m.commons.NavigationService.openAnomalyDetail).toHaveBeenCalled();
    });
    it("onAnomalyClicked no context", function() {
        event.getSource.and.returnValue(control);

        spyOn(sap.secmon.ui.m.commons.NavigationService, "openAnomalyDetail");
        bindingContext.getModel.and.returnValue(model);

        libUnderTest.onAnomalyClicked(event);
        expect(sap.secmon.ui.m.commons.NavigationService.openAnomalyDetail).not.toHaveBeenCalled();
    });
    it("handleSort", function() {
        var controllerHelper = jasmine.createSpyObj("controllerHelper", ["getFilterInputIdsOfFilterBar", "getTemplate"]);
        spyOn(sap.ui.model, "Sorter");
        event.getParameters.and.returnValue({column : column});
        splitter.getContentAreas.and.returnValue(["1"]);
        tableScrollContainer.getLayoutData.and.returnValue(layoutData);
        table.getColumns.and.returnValue([column]);
        table.getBinding.and.returnValue(binding);
        libUnderTest.controllerHelper = controllerHelper;
        view.byId.and.callFake(function(id) {
            switch(id) {
            case "splitter":
                return splitter;
            case "tableScrollContainer":
                return tableScrollContainer;
            case "semanticEventsTable":
                return table;
            }
        });
       libUnderTest.handleSort(event);
       //expect(binding.attachDataReceived).toHaveBeenCalled();
    });
   function checkUnclear(invisibleId, expectedExpanded) {
        var idArray = [ "User", "System", "Service" ];
        idArray.push(invisibleId);

        var controlObject = prepareControls(idArray, false);
        var modelData = {
            userExpanded : false,
            userCollapsed : false,
            systemExpanded : false,
            systemCollapsed : false,
            serviceExpanded : false,
            serviceCollapsed : false
        };
        model.getData.and.returnValue(modelData);
        view.getModel.and.returnValue(model);
        view.byId.and.callFake(function(id) {
            switch(id) {
            case "semanticEventsTable":
                return table;
            default:
                if (!controlObject.hasOwnProperty(id)) {
                    controlObject[id] = {
                        control : jasmine.createSpyObj("control", [ "getVisible", "setVisible" ])
                    };
                    controlObject[id].control.getVisible.and.returnValue(true);
                }
                return controlObject[id].control;
            }
        });
        table.getColumns.and.returnValue([]);
        libUnderTest.controllerHelper = controllerHelper;

        libUnderTest.syncExpandCollapseButtons();

        var expanded = [ "userExpanded", "systemExpanded", "serviceExpanded" ];
        var excludedElement = expectedExpanded;
        expanded.filter(function (x) {
            return (x !== excludedElement);
        }).forEach(function (element) {
            expect(modelData[element]).toBeTruthy();
        });
        expect(modelData[expectedExpanded]).toBeFalsy();
        expect(modelData.userCollapsed).not.toBeTruthy();
        expect(modelData.systemCollapsed).not.toBeTruthy();
        expect(modelData.serviceCollapsed).not.toBeTruthy();
    }

    it("syncExpandedCollapseButtons user unclear", function () {
        checkUnclear("UserPseudonymInitiating", "userExpanded");
    });
    it("syncExpandedCollapseButtons user unclear", function () {
        checkUnclear("UserPseudonymActing", "userExpanded");
    });
    it("syncExpandedCollapseButtons user unclear", function () {
        checkUnclear("UserPseudonymTargeting", "userExpanded");
    });
    it("syncExpandedCollapseButtons user unclear", function () {
        checkUnclear("UserPseudonymTargeted", "userExpanded");
    });
    it("syncExpandedCollapseButtons system unclear", function () {
        checkUnclear("SystemIdActor", "systemExpanded");
    });
    it("syncExpandedCollapseButtons service unclear", function () {
        checkUnclear("ServiceTransactionName", "serviceExpanded");
    });
    it("syncExpandedCollapseButtons service unclear", function () {
        checkUnclear("ServiceProgramName", "serviceExpanded");
    });
    it("syncExpandedCollapseButtons system unclear", function () {
        checkUnclear("SystemTypeActor", "systemExpanded");
    });
    it("syncExpandedCollapseButtons system unclear", function () {
        checkUnclear("SystemIdInitiator", "systemExpanded");
    });
    it("syncExpandedCollapseButtons system unclear", function () {
        checkUnclear("SystemIdIntermediary", "systemExpanded");
    });
    it("syncExpandedCollapseButtons system unclear", function () {
        checkUnclear("SystemTypeIntermediary", "systemExpanded");
    });
    it("syncExpandedCollapseButtons system unclear", function () {
        checkUnclear("SystemIdReporter", "systemExpanded");
    });
    it("syncExpandedCollapseButtons system unclear", function () {
        checkUnclear("SystemTypeReporter", "systemExpanded");
    });
    it("syncExpandedCollapseButtons system unclear", function () {
        checkUnclear("SystemIdTarget", "systemExpanded");
    });
    it("syncExpandedCollapseButtons system unclear", function () {
        checkUnclear("SystemTypeTarget", "systemExpanded");
    });
    it("handleAddToInvestigationPressed with no event selected", function() {
       libUnderTest.oInvestigationAddendum = jasmine.createSpyObj("oInvestigationAddendum",["showGeneralInvestigationAddendumDialog"]);
       spyOn(libUnderTest, "getSemanticEventsTable").and.returnValue(table);
       table.getSelectedContextPaths.and.returnValue([]);
       model.getProperty.and.callFake(function(sPath) {
           return sPath;
       });

       libUnderTest.handleAddToInvestigationPressed(event);
       expect(libUnderTest.oInvestigationAddendum.showGeneralInvestigationAddendumDialog).not.toHaveBeenCalled();
    });
    it("handleAddToInvestigationPressed with a event selected", function() {
        libUnderTest.oInvestigationAddendum = jasmine.createSpyObj("oInvestigationAddendum",["showGeneralInvestigationAddendumDialog"]);
        spyOn(libUnderTest, "getSemanticEventsTable").and.returnValue(table);
        table.getSelectedContextPaths.and.returnValue(["path1"]);
        model.getProperty.and.callFake(function(sPath) {
            return sPath;
        });

        libUnderTest.handleAddToInvestigationPressed(event);
        expect(libUnderTest.oInvestigationAddendum.showGeneralInvestigationAddendumDialog).toHaveBeenCalled();
     });
    it("handleAddToInvestigationPressed with a multiple events selected", function() {
        libUnderTest.oInvestigationAddendum = jasmine.createSpyObj("oInvestigationAddendum",["showGeneralInvestigationAddendumDialog"]);
        spyOn(libUnderTest, "getSemanticEventsTable").and.returnValue(table);
        table.getSelectedContextPaths.and.returnValue(["path1", "path2", "path3"]);
        model.getProperty.and.callFake(function(sPath) {
            return sPath;
        });

        libUnderTest.handleAddToInvestigationPressed(event);
        expect(libUnderTest.oInvestigationAddendum.showGeneralInvestigationAddendumDialog).toHaveBeenCalled();
    });


    function prepareControls(defaultIdArray, defaultValue) {
        var defaultVal = defaultValue;
        var controlObject = {};
        defaultIdArray.forEach(function (x) {
            controlObject[x] = {
                control : jasmine.createSpyObj("control", [ "getVisible", "setVisible" ])
            };
            controlObject[x].control.getVisible.and.returnValue(defaultVal);

        });
        return controlObject;
    }
});
