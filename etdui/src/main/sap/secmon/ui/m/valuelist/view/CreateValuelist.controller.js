jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.m.MessageToast");
jQuery.sap.require("sap.secmon.ui.m.valuelist.util.ODataErrorHandler");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.valuelist.view.CreateValuelist", {

    NAMESPACES_SOURCE_URL : "/sap/secmon/services/NameSpacesOriginalInSystem.xsodata",

    entityName : "ValuelistDetail",

    csrfToken : "",

    /**
     * @memberOf sap.secmon.ui.m.valuelist.view.Master
     */
    constructor : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        sap.ui.core.mvc.Controller.apply(this, arguments);
        this.ajaxUtil = new sap.secmon.ui.commons.AjaxUtil();
    },

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     */
    onInit : function() {

        this.csrfToken = this.oCommons.getXCSRFToken();

        var newValuelistModel = new sap.ui.model.json.JSONModel();
        this.getView().setModel(newValuelistModel, "newValuelist");
        this._setDefaulValues();

        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);
    },

    handleRouteMatched : function(oEvent) {

        var param = oEvent.getParameter("name");
        if ("createValuelist" !== param) {
            return;
        }
    },

    /**
     * Eventhandler: Saves new or edited valuelist header, and values which are in local namespace.
     */
    onSave : function() {
        this.createValuelistHeader();
    },

    onNavBack : function() {
        window.history.go(-1);
    },

    /**
     */
    onCancel : function() {
        var controller = this;
        this._setDefaulValues();
        sap.ui.core.UIComponent.getRouterFor(controller).navTo("main", {}, true);

    },

    /**
     * Creates new valuelist that is currently available in "newValuelist"-Model.
     */
    createValuelistHeader : function() {
        var controller = this;
        var oNewValuelistModel = this.getView().getModel("newValuelist");
        var oModel = this.getView().getModel();
        // read selected namespace
        var oNameSpaceSelect = this.getView().byId("nameSpaceSelectCreate");
        var selectedNameSpace = oNameSpaceSelect.getSelectedItem().getProperty("text");
        // set nameSpace into valuelist
        var oValuelist = oNewValuelistModel.getData();
        oValuelist.NameSpace = selectedNameSpace;
        oValuelist.CreatedBy = this.getView().getModel("applicationContext").getProperty("/userName");
        oValuelist.CreatedTimestamp = new Date();

        oModel.setHeaders({
            "content-type" : "application/json;charset=utf-8"
        });
        oModel.create('/Header', oValuelist, null, function(response) {
            sap.m.MessageToast.show(controller.getText("VL_Create_Success"));
            var valuelistModel = controller.getView().getModel();
            valuelistModel.refresh();
            var valuelistId = controller.oCommons.base64ToHex(response.Id);
            // var sRouteName = sap.ui.Device.system.phone ? "valuelist" : "main";
            var sRouteName = "valuelist";
            sap.ui.core.UIComponent.getRouterFor(controller).navTo(sRouteName, {
                query : "?mode=display",
                ValuelistDetail : "Header(X'" + valuelistId + "')",
            }, true);
            controller._setDefaulValues();
        }, function(e) {
            var oI18nModel = controller.getView().getModel("i18n");
            sap.secmon.ui.m.valuelist.util.ODataErrorHandler.showAlert(e.response, oI18nModel);
        });

    },

    _setDefaulValues : function() {
        var oData = {
            // Dummy GUID. OData expects an entry for each field and validates its format. Will be replaced on server with a unique one.
            Id : "0000000000000000",
            NameSpace : '',
            ListName : '',
            Description : '',
            UpdateMode : 'MANUAL'
        };
        this.getView().getModel("newValuelist").setData(oData);
    }

});
