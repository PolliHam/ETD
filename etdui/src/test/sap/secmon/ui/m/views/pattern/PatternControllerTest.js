describe("pattern.controller Tests", function () {
    jQuery.sap.require({
        modName: "sap.secmon.ui.m.views.pattern.Pattern",
        type: "controller"
    });

    var libUnderTest;
    var view, binding, dialog, parentView, errorHandler, bindingContext, router, uicomponent, event, model, table,
        iconTabBar, item, control;
    afterEach(function () {
    });
    beforeEach(function () {
        libUnderTest = sap.ui.controller("sap.secmon.ui.m.views.pattern.Pattern");
        model = jasmine.createSpyObj("model", ["getProperty", "setProperty", "refresh", "detachRequestCompleted", "read",
            "getData", "setData"]);
        configModel = jasmine.createSpyObj("model", ["getProperty", "setProperty", "refresh", "detachRequestCompleted", "read",
            "getData", "setData"]);

        uicomponent = jasmine.createSpyObj("uicomponent", ["getRouterFor", "getCsrfToken", "getModel"]);
        uicomponent.getModel.and.returnValue(model);
        spyOn(libUnderTest, "getComponent").and.returnValue(uicomponent);

        view = jasmine.createSpyObj("view", ["addDependent", "getBindingContext", "setModel", "byId", "addStyleClass",
            "getModel", "getController", "getId", "bindElement"]);
        spyOn(libUnderTest, "getView").and.returnValue(view);
   
        dialog = jasmine.createSpyObj("dialog", ["setModel", "open", "close", "focus", "getModel", "getParent", "getBinding", "getItems"]);
        validationService = jasmine.createSpyObj("InputValidationService", ["resetValueStateOfControls", "checkControls"]);
        binding = jasmine.createSpyObj("binding", ["filter", "attachEventOnce"]);
        bindingContext = jasmine.createSpyObj("bindingContext", ["getProperty", "getObject"]);
        view.getBindingContext.and.returnValue(bindingContext);
        event = jasmine.createSpyObj("event", ["getParameter", "getSource", "getId"]);
        table = jasmine.createSpyObj("table", ["getSelectedItem"]);
        iconTabBar = jasmine.createSpyObj("iconTabBar", ["getItems", "setSelectedKey"]);
        control = jasmine.createSpyObj("control", ["open", "close", "setText", "getText", "getBindingContext", "addStyleClass", "removeStyleClass", "setBusy",
            "getSelectedKey", "setSelectedKey", "getSelectedItem", "setValue", "getValue", "getTitle", "getDescription", "getBinding", "bindElement"]);
        item = jasmine.createSpyObj(item, ["getVisible", "getKey"]);
        router = jasmine.createSpyObj("router", ["attachRoutePatternMatched", "navTo"]);

        event.getSource.and.returnValue(control);
        control.getBindingContext.and.returnValue(bindingContext);
        control.getBinding.and.returnValue(binding);
        view.getModel.and.returnValue(model);
        view.byId.and.returnValue(control);
        view.getModel.withArgs("config").and.returnValue(configModel);
        dialog.getBinding.and.returnValue(binding);

        spyOn(sap.ui.core.UIComponent, "getRouterFor").and.returnValue(router);
        spyOn(sap.ui.core.mvc.Controller, "apply").and.returnValue();
        spyOn(sap.m.MessageBox, "alert").and.returnValue();
        spyOn(sap.m.MessageBox, "show").and.returnValue();
        spyOn(sap.m.MessageToast, "show").and.returnValue();
        spyOn(sap.m.MessageBox, "confirm");
        spyOn($, "ajax");
        spyOn(window, "open");


        sap.ui.Device.system.phone = false;
    });

    it('prints jasmine version', function () {
        console.log('jasmine-version:' + jasmine.version || (jasmine.getEnv().versionString && jasmine.getEnv().versionString()));
    });

    it("constructor Test", function () {
        sap.ui.controller("sap.secmon.ui.m.views.pattern.Pattern");
        expect(sap.ui.core.mvc.Controller.apply).toHaveBeenCalled();
        expect(libUnderTest.sPatternId).toBe(null);
        expect(libUnderTest.fnPatternExecutionCallback).toBe(null);
        expect(libUnderTest.oInitialEditModelData).toBe(null);
    });
    it("onRouteMatched call with tab property", function () {
        var oEvent = {
            getParameter: function () {
                return {tab: "valueLists"};
            }
        };

        model.setProperty.and.callFake(function (property, value) {
            expect(property).toBe("/selectedTab");
            expect(value).toBe("valueLists");
        });
        libUnderTest.onRouteMatched(oEvent);
    });
    it("onRouteMatched call without tab property", function () {
        var oEvent = {
            getParameter: function () {
                return {};
            }
        };

        model.setProperty.and.callFake(function (property, value) {
            expect(property).toBe("/selectedTab");
            expect(value).toBe("alertValidity");
        });
        libUnderTest.onRouteMatched(oEvent);
    });
    it("onRequestCompleted: selecting tab when ALERT; displayMode", function () {
        libUnderTest.sPatternId = "sPatternId";
        model.getProperty.withArgs("/PatternDefinitionAndAlertCountLast24h(X'sPatternId')").and.returnValue({
            ExecutionOutput: "ALERT"
        });
        configModel.getData.and.returnValue({
            selectedTab: "alertValidity",
            editMode: false,
            displayMode: true
        });
        view.byId.withArgs("idIconTabBar").and.returnValue(iconTabBar);


        libUnderTest.onRequestCompleted();
        expect(iconTabBar.setSelectedKey).toHaveBeenCalledWith("alertValidity");
        expect(model.setData).not.toHaveBeenCalled();
    });
    it("onRequestCompleted: selecting tab when non ALERT; editMode", function () {
        libUnderTest.sPatternId = "sPatternId";
        model.getProperty.withArgs("/PatternDefinitionAndAlertCountLast24h(X'sPatternId')").and.returnValue({
            ExecutionOutput: "NO_ALERT"
        });
        configModel.getData.and.returnValue({
            selectedTab: "alertValidity",
            editMode: true,
            displayMode: false
        });
        view.byId.withArgs("idIconTabBar").and.returnValue(iconTabBar);
        bindingContext.getProperty.and.returnValue();
        bindingContext.getProperty.withArgs("IndicatorTimeframe").and.returnValue(60 * 60 * 1000);

        libUnderTest.onRequestCompleted();
        expect(iconTabBar.setSelectedKey).toHaveBeenCalledWith("valueLists");
    });
    it("onCreateNewTag: fragment have been created and opened", function () {
        spyOn(sap.ui, "xmlfragment").and.returnValue(control);   //tricky check
        sap.ui.core.Fragment = jasmine.createSpyObj("Fragment", ["byId"]);
        sap.ui.core.Fragment.byId.and.returnValue(control);
        event.getParameter.and.returnValue("file");

        libUnderTest.onCreateNewTag(event);
        expect(libUnderTest._oNewTagDialog).toBe(control)
        expect(libUnderTest._oNewTagDialog.open).toHaveBeenCalled();
    });
    it("onNewTagDialogClose: token added, dialog closed", function () {
        sap.ui.core.Fragment = jasmine.createSpyObj("Fragment", ["byId"]);
        sap.ui.core.Fragment.byId.and.returnValue(control);
        control.getSelectedItem.and.returnValue(control);
        spyOn(libUnderTest, "createAndAddToken").and.returnValue();
        spyOn(libUnderTest, "onNewTagDialogClose").and.returnValue();
        libUnderTest._oNewTagDialog = control;

        libUnderTest.onNewTagDialogClose();
        // expect(libUnderTest.createAndAddToken).toHaveBeenCalled();
        // expect(libUnderTest._oNewTagDialog.close).toHaveBeenCalled();
    });
    it("onNewTagDialogCancel: no token added, dialog closed", function () {
        sap.ui.core.Fragment = jasmine.createSpyObj("Fragment", ["byId"]);
        sap.ui.core.Fragment.byId.and.returnValue(control);
        spyOn(libUnderTest, "createAndAddToken").and.returnValue();
        libUnderTest._oNewTagDialog = control;

        libUnderTest.onNewTagDialogCancel();
        expect(libUnderTest.createAndAddToken).not.toHaveBeenCalled();
        expect(libUnderTest._oNewTagDialog.close).toHaveBeenCalled();
    });
    // it("onTagValueHelpRequest: fragment have been created and opened", function () {
    //     libUnderTest.tagValueHelpDialog = dialog;
    //     spyOn(sap.ui, "xmlfragment").and.returnValue(control);   //tricky check
    //     sap.ui.core.Fragment = jasmine.createSpyObj("Fragment", ["byId"]);
    //     sap.ui.core.Fragment.byId.and.returnValue(control);
    //     event.getParameter.and.returnValue("file");
        
    //     libUnderTest.onTagValueHelpRequest(event);
    //     expect(libUnderTest.tagValueHelpDialog).toBe(control);
    //     expect(libUnderTest.tagValueHelpDialog.open).toHaveBeenCalled();
    // // });
    // it("onTagValueHelpClose: item was selected, token added, filter cleared", function () {
    //     event.getParameter.and.returnValue(control);
    //     spyOn(libUnderTest, "createAndAddToken").and.returnValue();

    //     libUnderTest.onTagValueHelpClose(event);
    //     expect(libUnderTest.createAndAddToken).toHaveBeenCalled();
    //     expect(binding.filter).toHaveBeenCalledWith([]);
    // });
    // it("onTagValueHelpClose: item was not selected, token not added, filter cleared", function () {
    //     event.getParameter.and.returnValue();
    //     spyOn(libUnderTest, "createAndAddToken").and.returnValue();

    //     libUnderTest.onTagValueHelpClose(event);
    //     expect(libUnderTest.createAndAddToken).not.toHaveBeenCalled();
    //     expect(binding.filter).toHaveBeenCalledWith([]);
    // });
    it("onTagValueHelpSearch: filter was applied", function () {
        spyOn(sap.ui.model, "Filter").and.returnValue();   //tricky check
        libUnderTest.onTagValueHelpSearch(event);
        expect(sap.ui.model.Filter).toHaveBeenCalled();
        expect(binding.filter).toHaveBeenCalled();
    });
    it("onTagSuggestionSelected", function () {
        var item = jasmine.createSpyObj("item", ["getCustomData"]);
        item.getCustomData.and.returnValue([control, control]);
        event.getParameter.and.returnValue(item);
        spyOn(libUnderTest, "createAndAddToken").and.returnValue();
        spyOn(libUnderTest, "onTagSuggestionSelected").and.returnValue();

        libUnderTest.onTagSuggestionSelected(event);
        // expect(libUnderTest.createAndAddToken).toHaveBeenCalled();
    });
    it("deleteDialog", function () {
        var dialog = jasmine.createSpyObj("dialog", ["close", "destroy"]);
        libUnderTest.deleteDialog(dialog);
        expect(dialog.close).toHaveBeenCalled();
        expect(dialog.destroy).toHaveBeenCalled();
    });
    it("onTabSelected", function () {
        libUnderTest.sPatternId = "sPatternId";
        event.getParameter.and.returnValue("selectedTab");

        
        libUnderTest.onTabSelected(event);
        expect(router.navTo).toHaveBeenCalledWith("pattern", {
            id: "sPatternId",
            tab: "selectedTab"
        }, true);
    });
    it("bindPattern. params was saved, data loaded, element binded", function () {
        spyOn(libUnderTest, "refreshData").and.returnValue();

        libUnderTest.bindPattern("oPatternDefinitionToAlertsModel", "sPatternId", "fnCallback", "fnNavBackCallback", "oThisForCallback");
        expect(libUnderTest.fnPatternExecutionCallback).toBe("fnCallback");
        expect(libUnderTest.fnNavBackCallback).toBe("fnNavBackCallback");
        expect(libUnderTest.oThisForCallback).toBe("oThisForCallback");
        expect(libUnderTest.sPatternId).toBe("sPatternId");
        expect(libUnderTest.refreshData).toHaveBeenCalled();
        expect(view.setModel).toHaveBeenCalledWith("oPatternDefinitionToAlertsModel");
        expect(view.bindElement).toHaveBeenCalledWith("/PatternDefinitionAndAlertCountLast24h(X'sPatternId')");
    });
    it("refreshData", function () {
        spyOn(libUnderTest, "getOpenAlertsCount").and.returnValue();
        spyOn(libUnderTest, "getUsedValueLists").and.returnValue();
        spyOn(libUnderTest, "getExemptions").and.returnValue();
        spyOn(libUnderTest, "getTotalRuntimePattern").and.returnValue();

        libUnderTest.refreshData();
        expect(model.refresh).toHaveBeenCalled();
        expect(libUnderTest.getOpenAlertsCount).toHaveBeenCalled();
        expect(libUnderTest.getUsedValueLists).toHaveBeenCalled();
        expect(libUnderTest.getExemptions).toHaveBeenCalled();
        expect(libUnderTest.getTotalRuntimePattern).toHaveBeenCalled();
    });
    it("onTemplatesUpdateFinished", function () {
        event.getParameter.and.returnValue(666);
        model.setProperty.and.callFake(function (key, value) {
            expect(key).toBe("/invTemplatesCount");
            expect(value).toBe(666);
        });

        libUnderTest.onTemplatesUpdateFinished(event);
    });
    it("onAttachmentsUpdateFinished", function () {
        event.getParameter.and.returnValue(56);
        model.setProperty.and.callFake(function (key, value) {
            expect(key).toBe("/attachmentsCount");
            expect(value).toBe(56);
        });

        libUnderTest.onAttachmentsUpdateFinished(event);
    });
    it("openAlertsForCurrentPattern inEditMode", function () {
        spyOn(libUnderTest, "isEditMode").and.returnValue(true);
        spyOnNavigationService();
        libUnderTest.openAlertsForCurrentPattern(event);
        expect(sap.m.MessageBox.alert).toHaveBeenCalled();
        expect(sap.secmon.ui.m.commons.NavigationService.navigateToAlertsOfPattern).not.toHaveBeenCalled();
    });
    it("openAlertsForCurrentPattern inNonEditMode", function () {
        spyOn(libUnderTest, "isEditMode").and.returnValue(false);
        spyOnNavigationService();
        libUnderTest.openAlertsForCurrentPattern(event);
        expect(sap.m.MessageBox.alert).not.toHaveBeenCalled();
        expect(sap.secmon.ui.m.commons.NavigationService.navigateToAlertsOfPattern).toHaveBeenCalled();
    });
    it("onOpenPattern with no QueryDefinitionId", function () {
        spyOnNavigationService();
        libUnderTest.onOpenPattern(event);
        expect(sap.secmon.ui.m.commons.NavigationService.openBrowseUI).not.toHaveBeenCalled();
        expect(sap.secmon.ui.m.commons.NavigationService.openAnomalyPattern).not.toHaveBeenCalled();
    });
    it("onOpenPattern witho QueryDefinitionId and patternType FLAB", function () {
        spyOnNavigationService();
        bindingContext.getProperty.and.returnValue("FLAB");
        libUnderTest.onOpenPattern(event);
        expect(sap.secmon.ui.m.commons.NavigationService.openBrowseUI).toHaveBeenCalled();
        expect(sap.secmon.ui.m.commons.NavigationService.openAnomalyPattern).not.toHaveBeenCalled();
    });
    it("onOpenPattern witho QueryDefinitionId and patternType ANOMALY", function () {
        spyOnNavigationService();
        bindingContext.getProperty.and.returnValue("ANOMALY");
        libUnderTest.onOpenPattern(event);
        expect(sap.secmon.ui.m.commons.NavigationService.openBrowseUI).not.toHaveBeenCalled();
        expect(sap.secmon.ui.m.commons.NavigationService.openAnomalyPattern).toHaveBeenCalled();
    });
    it("onSave control validation failed", function () {
        libUnderTest.oInputValidationService = jasmine.createSpyObj("valServ", ["checkControls"]);
        libUnderTest.oInputValidationService.checkControls.and.returnValue(false);
        spyOn(libUnderTest, "updatePattern").and.returnValue();
        spyOn(libUnderTest, "setEditMode").and.returnValue();

        libUnderTest.onSave();
        expect(libUnderTest.oInputValidationService.checkControls).toHaveBeenCalled();
        expect(libUnderTest.updatePattern).not.toHaveBeenCalled();
        expect(libUnderTest.setEditMode).not.toHaveBeenCalled();
    });
    it("onSave control validation successful", function () {
        libUnderTest.oInputValidationService = jasmine.createSpyObj("valServ", ["checkControls"]);
        libUnderTest.oInputValidationService.checkControls.and.returnValue(true);
        spyOn(libUnderTest, "updatePattern").and.returnValue();
        spyOn(libUnderTest, "setEditMode").and.returnValue();

        libUnderTest.onSave();
        expect(libUnderTest.oInputValidationService.checkControls).toHaveBeenCalled();
        expect(libUnderTest.updatePattern).toHaveBeenCalled();
        expect(libUnderTest.setEditMode).toHaveBeenCalled();
    });
    it("updatePattern", function () {
        libUnderTest.PATTERN_MODIFICATION_SERVICE_URL = "PATTERN_MODIFICATION_SERVICE_URL";
        bindingContext.getProperty.and.returnValue("1234RT43FF444E0");
        model.getData.and.returnValue({
            QueryDefinitionId: 'D76DF8453E37145E38E04D',
            Status: "Status",
            Frequency: "Frequency",
            Severity: "Severity",
            ThresholdOperator: "ThresholdOperator",
            Threshold: "Threshold",
            TestMode: true,
            IndicatorTimeframe: 2
        });
        spyOn(libUnderTest, "setEditMode").and.returnValue();
        spyOn(libUnderTest, "getTags").and.returnValue(["arrayOfTags"]);
        spyOn(libUnderTest, "sendRequestAndUpdateModel").and.returnValue();


        libUnderTest.updatePattern();
        expect(libUnderTest.getTags).toHaveBeenCalled();
        expect(libUnderTest.sendRequestAndUpdateModel).toHaveBeenCalledWith("POST", "PATTERN_MODIFICATION_SERVICE_URL", {
            QueryDefinitionId: 'D76DF8453E37145E38E04D',
            Status: "Status",
            Frequency: "Frequency",
            Severity: "Severity",
            ThresholdOperator: "ThresholdOperator",
            Threshold: "Threshold",
            TestMode: "TRUE",
            IndicatorTimeframe: 7200000,
            Tags: ["arrayOfTags"]
        });
    });
    it("handleCancel nothing was changed, editMode = false, callBack was called", function () {
        libUnderTest.oInitialEditModelData = {data: "someData"};
        model.getData.and.returnValue({data: "someData"});
        spyOn(libUnderTest, "setEditMode").and.returnValue();

        var fnCallbackWasCalled = false;
        libUnderTest.handleCancel(function () {
            fnCallbackWasCalled = true;
        });
        expect(sap.m.MessageBox.show).not.toHaveBeenCalled();
        expect(libUnderTest.setEditMode).toHaveBeenCalledWith(false);
        expect(fnCallbackWasCalled).toBe(true);
    });
    it("handleCancel data was changed", function () {
        libUnderTest.oInitialEditModelData = {data: "someData"};
        model.getData.and.returnValue({data: "changedData"});
        spyOn(libUnderTest, "setEditMode").and.returnValue();

        var fnCallbackWasCalled = false;
        libUnderTest.handleCancel(function () {
            fnCallbackWasCalled = true;
        });
        expect(sap.m.MessageBox.show).toHaveBeenCalled();
    });
    it("setEditMode", function () {
        editModel = jasmine.createSpyObj("model", ["getProperty", "setProperty", "refresh", "detachRequestCompleted", "read",
            "getData", "setData"]);
        view.getModel.withArgs("editModel").and.returnValue(editModel);      
        bindingContext.getProperty
            .withArgs("Status").and.returnValue("ACTIVE")
            .withArgs("Frequency").and.returnValue(10)
            .withArgs("Severity").and.returnValue("MEDIUM")
            .withArgs("Threshold").and.returnValue(1)
            .withArgs("ThresholdOperator").and.returnValue(">=")
            .withArgs("TestMode").and.returnValue("TRUE")            
            .withArgs("IndicatorTimeframe").and.returnValue(0);
        libUnderTest.oInputValidationService = jasmine.createSpyObj("valServ", ["resetValueStateOfControls"]);

        libUnderTest.setEditMode(true);

        expect(editModel.setData).toHaveBeenCalled();
        expect(libUnderTest.oInitialEditModelData.Status).toBe("ACTIVE");
        expect(libUnderTest.oInitialEditModelData.Frequency).toBe(10);
        expect(libUnderTest.oInitialEditModelData.Severity).toBe("MEDIUM");        
        expect(libUnderTest.oInitialEditModelData.Threshold).toBe(1);
        expect(libUnderTest.oInitialEditModelData.ThresholdOperator).toBe(">=");       
        expect(libUnderTest.oInitialEditModelData.TestMode).toBe(true);      
        expect(libUnderTest.oInitialEditModelData.IndicatorTimeframe).toBe(0);
        expect(libUnderTest.oInputValidationService.resetValueStateOfControls).toHaveBeenCalled();
    });
    it("onValuelistPress", function () {
        spyOnNavigationService();
        libUnderTest.onValuelistPress(event);
        expect(sap.secmon.ui.m.commons.NavigationService.openValuelist).toHaveBeenCalled();
    });
    it("onExemptionPress CrossApp navigation have been with right params", function () {
        var service = jasmine.createSpyObj("service", ["toExternal"]);
        sap.ushell.Container.getService.and.returnValue(service);
        bindingContext.getProperty.and.returnValue("idValue");

        libUnderTest.onExemptionPress(event);
        expect(sap.ushell.Container.getService).toHaveBeenCalledWith("CrossApplicationNavigation");
        expect(service.toExternal).toHaveBeenCalledWith({
            target: {
                semanticObject: "Exemptions",
                action: "show"
            },
            params: {
                Id: "idValue"
            }
        });
    });
    it("onUploadChange", function () {
        var fileUploader = jasmine.createSpyObj("fileUploader", ["setUploadUrl", "removeAllHeaderParameters", "addHeaderParameter"]);
        event.getSource.and.returnValue(fileUploader);
        event.getParameter.and.returnValue("file")
        libUnderTest.sPatternId = '123456';
        uicomponent.getCsrfToken.and.returnValue("token");

        libUnderTest.onUploadChange(event);
        expect(fileUploader.setUploadUrl).toHaveBeenCalledWith("/sap/secmon/services/ui/m/patterns/patternDocument.xsjs/?pattern_id=123456&file_name=file");
        expect(fileUploader.removeAllHeaderParameters).toHaveBeenCalled();
        expect(fileUploader.addHeaderParameter).toHaveBeenCalled();
    });
    it("onFileNameLengthExceed", function () {
        view.getModel.and.returnValue(model);
        libUnderTest.onFileNameLengthExceed();
        expect(sap.m.MessageBox.alert).toHaveBeenCalled();
    });
    it("onFileTypeMissmatch", function () {
        view.getModel.and.returnValue(model);
        libUnderTest.onFileTypeMissmatch();
        expect(sap.m.MessageBox.alert).toHaveBeenCalled();
    });
    it("onFileSizeExceed", function () {
        view.getModel.and.returnValue(model);
        libUnderTest.onFileSizeExceed();
        expect(sap.m.MessageBox.alert).toHaveBeenCalled();
    });
    it("onDeletePressed no table", function () {
        view.getModel.and.returnValue(model);
        libUnderTest.onDeletePressed(event);
        expect(sap.m.MessageBox.confirm).not.toHaveBeenCalled();
        expect($.ajax).not.toHaveBeenCalled();
    });
    it("onDeletePressed no items selected", function () {
        view.getModel.and.returnValue(model);
        view.byId.and.returnValue(table);
        libUnderTest.onDeletePressed(event);
        expect(sap.m.MessageBox.confirm).not.toHaveBeenCalled();
        expect($.ajax).not.toHaveBeenCalled();
    });
    it("onDeletePressed items selected", function () {
        view.getModel.and.returnValue(model);
        var item = jasmine.createSpyObj("item", ["getBindingContext"]);
        item.getBindingContext.and.returnValue(bindingContext);
        table.getSelectedItem.and.returnValue(item);
        view.byId.and.returnValue(table);
        bindingContext.getObject.and.returnValue({PatternId: "123456", ContentName: "File", ContentType: "pdf"})
        libUnderTest.onDeletePressed.call(libUnderTest, event);
        expect(sap.m.MessageBox.confirm).toHaveBeenCalled();
        expect($.ajax).not.toHaveBeenCalled();

        sap.m.MessageBox.confirm.calls.mostRecent().args[1](sap.m.MessageBox.Action.Cancel);
        expect($.ajax).not.toHaveBeenCalled();
        sap.m.MessageBox.confirm.calls.mostRecent().args[1](sap.m.MessageBox.Action.OK);
        expect($.ajax).toHaveBeenCalled();
    });
    it("onUploadComplete with status not OK", function () {
        view.getModel.and.returnValue(model);
        libUnderTest.onUploadComplete(event);
        expect(sap.m.MessageBox.alert).toHaveBeenCalled();
        expect(model.refresh).toHaveBeenCalled();
        expect(sap.m.MessageBox.show).not.toHaveBeenCalled();
        expect(sap.m.MessageToast.show).not.toHaveBeenCalled();
    });
    it("onUploadComplete with status  OK", function () {
        view.getModel.and.returnValue(model);
        event.getParameter.and.returnValue(200);
        libUnderTest.onUploadComplete(event);
        expect(sap.m.MessageBox.alert).not.toHaveBeenCalled();
        expect(model.refresh).toHaveBeenCalled();
        expect(sap.m.MessageBox.show).not.toHaveBeenCalled();
        expect(sap.m.MessageToast.show).toHaveBeenCalled();
    });
    it("handleCreateException", function () {
        libUnderTest.sPatternId = "sPatternId";
        libUnderTest.oAlertExceptionCreator = jasmine.createSpyObj("alertEx", ["showAlertExceptionCreationDialog"]);
        libUnderTest.handleCreateException();
        expect(libUnderTest.oAlertExceptionCreator.showAlertExceptionCreationDialog).toHaveBeenCalled();
    });
    it("onPressHelp", function () {
        libUnderTest.onPressHelp();
        expect(window.open).toHaveBeenCalled();
    });
    it("onTemplatePress", function () {
        spyOnNavigationService();
        libUnderTest.onTemplatePress(event);
        expect(sap.secmon.ui.m.commons.NavigationService.openInvestigationTemplate).toHaveBeenCalled();
    });
    it("onAddTemplatePressed", function () {
        spyOnNavigationService();
        libUnderTest.onAddTemplatePressed(event);
        expect(sap.secmon.ui.m.commons.NavigationService.createInvestigationTemplate).toHaveBeenCalled();
    });

    function spyOnNavigationService() {
        spyOn(sap.secmon.ui.m.commons.NavigationService, "openBrowseUI");
        spyOn(sap.secmon.ui.m.commons.NavigationService, "openAnomalyPattern");
        spyOn(sap.secmon.ui.m.commons.NavigationService, "openInvestigationTemplate");
        spyOn(sap.secmon.ui.m.commons.NavigationService, "createInvestigationTemplate");
        spyOn(sap.secmon.ui.m.commons.NavigationService, "openValuelist");
        spyOn(sap.secmon.ui.m.commons.NavigationService, "navigateToAlertsOfPattern");
    }
});