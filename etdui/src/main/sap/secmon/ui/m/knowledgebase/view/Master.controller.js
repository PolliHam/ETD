jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.commons.RequestUtils");
jQuery.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
jQuery.sap.require("sap.secmon.ui.m.knowledgebase.util.Common");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");
jQuery.sap.require("sap.secmon.ui.m.knowledgebase.util.ODataErrorHandler");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.knowledgebase.view.Master", {
    EVENT_SERVICE_URL : "/sap/secmon/services/ui/knowledgebase/event.xsjs",
    messageUtil : new sap.secmon.ui.commons.GlobalMessageUtil(),

    constructor : function() {

        // IMPORTANT: all programmatic selection has to change this member!
        this.lastSelectedItem = null;
        sap.ui.core.mvc.Controller.apply(this, arguments);
    },

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     */
    onInit : function() {
        var model = new sap.ui.model.json.JSONModel({
            NewEnabled : false
        });
        this.ownCommons = new sap.secmon.ui.m.knowledgebase.util.Common();
        this.requestCommons = new sap.secmon.ui.m.commons.RequestUtils();
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        sap.ui.core.UIComponent.getRouterFor(this).attachRoutePatternMatched(this.onRouteMatched, this);
        this.getView().setModel(model, "uiModel");
        this.oCreateNewEventModel = new sap.ui.model.json.JSONModel();
        this.createNewDialog();
    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    onRouteMatched : function(oEvent) {
        var sName = oEvent.getParameter("name");
        this.setRouteName(sName);

        if (!sap.ui.Device.system.phone) {
            if (sName === "main") {
                this.selectFirstListItem();
            } else {
                this.selectListItemByRouteName(sName);
            }
        }

    },

    retrieveRouteName : function(oListItem) {
        var aCustomData = oListItem.getCustomData();
        var i;
        for (i = 0; i < aCustomData.length; i++) {
            if (aCustomData[i].getKey() === "route") {
                return aCustomData[i].getValue();
            }
        }
        return this.getRouteName();
    },

    /** The select event registered in the view */
    onSelect : function(oEvent) {
        var oList = this.getView().byId("list");
        var oLastItem = this.lastSelectedItem;
        this.lastSelectedItem = oList.getSelectedItem();
        var that = this;

        // Get the list item, either from the listItem parameter or from the
        // event's
        // source itself (will depend on the device-dependent mode).
        var oSource = oEvent.getParameter("listItem") || oEvent.getSource();

        var routeName = this.retrieveRouteName(oSource);
        this.setRouteName(routeName);

        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            that.showDetail(routeName, {});
        }).fail(function() {
            if (oLastItem) {
                that.setSelectedItem(oLastItem);
            }
        });

    },

    selectFirstListItem : function() {
        var oList = this.getView().byId("list");
        var aItems = oList.getItems();
        this.setSelectedItem(aItems[0]);
        if (!(sap.ui.Device.system.phone && sap.ui.orientation.portrait)) {
            var routeName = this.retrieveRouteName(aItems[0]);
            this.showDetail(routeName, {});
        }
    },

    selectListItemByRouteName : function(sRouteName) {
        var oList = this.getView().byId("list");
        var oUIModel = this.getView().getModel('uiModel');
        var aItems = oList.getItems(), hasNew = false;
        var that = this;
        aItems.forEach(function(oListItem) {
            var aCustomData = oListItem.getCustomData();
            var i;
            for (i = 0; i < aCustomData.length; i++) {
                if (aCustomData[i].getKey() === "route" && aCustomData[i].getValue() === sRouteName) {
                    that.setSelectedItem(oListItem);
                    that.showDetail(sRouteName, {});
                    if (that.getView().oPropagatedProperties.oModels.applicationContext.oData.userPrivileges.knowledgeBaseWrite) {
                        switch (sRouteName) {
                        case 'events':
                            hasNew = true;
                            break;
                        case 'logtypes':
                            hasNew = true;
                            break;
                        case 'attributes':
                            hasNew = false;
                            break;
                        }
                    }
                }

            }
        });
        oUIModel.setProperty('/NewEnabled', hasNew);
    },
    showDetail : function(routeName, oParams) {
        // If we're on a phone, include nav in history; if not, don't.
        var bReplace = sap.ui.Device.system.phone ? false : true;
        sap.ui.core.UIComponent.getRouterFor(this).navTo(routeName, oParams, bReplace);
    },

    setSelectedItem : function(oItem) {
        var oList = this.getView().byId("list");
        oList.setSelectedItem(oItem, true);
        this.lastSelectedItem = oItem;
    },

    onBackButtonPressed : function() {

        this.getComponent().getNavigationVetoCollector().noVetoExists().then(function() {
            window.history.go(-1);
        });
    },

    setRouteName : function(sRouteName) {
        this.routeName = sRouteName;
    },

    getCreateNewEventModel : function() {
        var data = {
            name : '',
            displayName : '',
            description : ''
        };
        this.oCreateNewEventModel.setData(data);

        return this.oCreateNewEventModel;
    },

    /**
     * Handle click on new button. Navigate to "Events" or "Log Types" depending on the item selected
     * 
     * @param oEvent
     */
    onNew : function(oEvent) {

        var routeName = this.getRouteName(oEvent);

        if (routeName === "events") {
            this.createNewEvent(oEvent);
        } else {
            if (routeName === "logtypes") {
                this.createNewLogType(oEvent);
            }
        }
    },

    /**
     * Get route name of the item selected
     * 
     * @param oEvent
     */
    getRouteName : function(oEvent) {

        var oView = this.getView();
        var oList = oView.byId("list");
        var item = oList.getSelectedItem();
        var routeName;

        var aCustomData = item.getCustomData();
        aCustomData.forEach(function(customData) {
            if (customData.getKey() === "route") {
                routeName = customData.getValue();
            }
        });

        return routeName;
    },

    /**
     * Show popup for creating a new event
     * 
     * @param oEvent
     */
    createNewEvent : function(oEvent) {
        var oView = this.getView();
        var oTextBundle = oView.getModel("i18n").getResourceBundle();
        this.oNewDialog.setTitle(oTextBundle.getText("KB_CreateEvent"));
        this.oNewDialog.setModel(this.getCreateNewEventModel(), "newEntry");
        this.oNewDialog.open();
    },

    /**
     * Create "New" dialog
     * 
     * @param oEvent
     */
    createNewDialog : function() {
        var oView = this.getView();

        if (!this.oNewDialog) {
            this.oNewDialog = sap.ui.xmlfragment(oView.getId(), "sap.secmon.ui.m.knowledgebase.view.NewDialog", this);
            oView.addDependent(this.oNewDialog);

            var aInputs = [ oView.byId("createNewName"), oView.byId("createNewDisplayName") ];
            this.oInputValidationService = new sap.secmon.ui.commons.InputValidationService(aInputs);
        }
    },

    /**
     * Event handler: Handle click on save button for the "create new event" button
     * 
     * @param oEvent
     */
    onSaveNew : function(oEvent) {
        var routeName = this.getRouteName(oEvent);

        if (routeName === "events") {
            this.onSaveNewEvents();
        } else {
            if (routeName === "logtypes") {
                this.onSaveNewLogType();
            }
        }
    },

    /**
     * Event handler: Handle click on save button for the "create new event" button
     * 
     * @param oEvent
     */
    onSaveNewEvents : function() {
        if (!this.oInputValidationService.checkControls()) {
            return;
        }
        var oView = this.getView();
        var oTextBundle = oView.getModel("i18n").getResourceBundle();
        var oKnowledgeBaseModel = oView.getModel("Knowledgebase");
        var oCreateNewEventModelData = this.oNewDialog.getModel("newEntry").getData();
        oCreateNewEventModelData.NameSpace = oView.byId("createNewEventNameSpace").getSelectedItem().getProperty("text");
        if (!this.ownCommons.checkNamespace(oCreateNewEventModelData.NameSpace, oTextBundle)) {
            return;
        }

        var sCSRFToken = this.oCommons.getXCSRFToken();

        this.ownCommons.onSaveEvent(this, oView, oKnowledgeBaseModel, oTextBundle, oCreateNewEventModelData, this.EVENT_SERVICE_URL + "?create=true", sCSRFToken, this.oNewDialog,
                this.oInputValidationService);
    },

    /**
     * Event handler: Handle click on save button for the "create new event" button
     * 
     * @param oEvent
     */
    onCancelNew : function(oEvent) {
        this.ownCommons.closeDialog(this.oNewDialog);

        // Reset input validation
        this.oInputValidationService.resetValueStateOfControls();
    },

    /**
     * Event handler: Show popup for creating a new log type
     * 
     * @param oEvent
     */
    createNewLogType : function(oEvent) {
        var oView = this.getView();
        var oTextBundle = oView.getModel("i18n").getResourceBundle();
        this.oNewDialog.setTitle(oTextBundle.getText("KB_CreateLogType"));
        this.oNewDialog.setModel(this.getCreateNewEventModel(), "newEntry");
        this.oNewDialog.open();
    },

    /**
     * Event handler: Handle click on save button for the "create new" button on the log types tab
     * 
     * @param oEvent
     */
    onSaveNewLogType : function() {

        if (!this.oInputValidationService.checkControls()) {
            return;
        }
        var oView = this.getView(), oController = this;
        var oNewLogType = {}, oTextBundle = oView.getModel("i18n").getResourceBundle();
        var oModel = this.oNewDialog.getModel("Knowledgebase");
        var oCreateNewLogTypeModelData = this.oNewDialog.getModel("newEntry").getData();
        oCreateNewLogTypeModelData.NameSpace = oView.byId("createNewEventNameSpace").getSelectedItem().getProperty("text");
        if (!this.ownCommons.checkNamespace(oCreateNewLogTypeModelData.NameSpace, oTextBundle)) {
            return;
        }

        oNewLogType.nameSpace = oCreateNewLogTypeModelData.NameSpace;
        oNewLogType.name = oCreateNewLogTypeModelData.name;
        oNewLogType.displayName = oCreateNewLogTypeModelData.displayName;
        oNewLogType.description = oCreateNewLogTypeModelData.description;
        oNewLogType.hash = '1299';
        oNewLogType.editable = 'true';

        var successText = oTextBundle.getText("KB_LogTypeSaved", [ oNewLogType.nameSpace, oNewLogType.name ]);

        // Create log type
        oModel.create('/LogType', oNewLogType, {
            error : function(oError) {
                var oI18nModel = oController.getView().getModel("i18n");
                var oI18nCommonModel = oController.getView().getModel("i18nCommon");
                sap.secmon.ui.m.knowledgebase.util.ODataErrorHandler.showAlert(oError, oI18nModel, oI18nCommonModel);
            },
            success : function(oResponse) {
                oController.messageUtil.addMessage(sap.ui.core.MessageType.Success, successText, successText);

                oController.ownCommons.closeDialog(oController.oNewDialog);

                // Refresh the log types table
                oView.getModel("Knowledgebase").refresh();

                // Reset input validation
                oController.oInputValidationService.resetValueStateOfControls();
            }
        });
    },

    /**
     * Event handler: Called when changing the content of an input field
     */
    onChange : function(oEvent) {
        var oView = this.getView();
        var oTextBundle = oView.getModel("i18n").getResourceBundle();
        this.ownCommons.onChange(oEvent, oTextBundle);
    },

    /**
     * Event handler: Called when updating the content of the display name input field
     */
    onLiveChangeDisplayName : function(oEvent) {
        var inputField = this.getView().byId("createNewName");
        this.ownCommons.onLiveChangeDisplayName(oEvent, inputField);
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/8fe4f80cbaf741c784d6244f05920988.html");
    },

    onExit : function() {
        this.ownCommons.destroyDialog(this.oNewDialog);

    }
});
