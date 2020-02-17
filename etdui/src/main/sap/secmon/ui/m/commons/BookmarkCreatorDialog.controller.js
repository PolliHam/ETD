jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.ushell.services.Bookmark");
jQuery.sap.require("sap.m.MessageToast");
jQuery.sap.require("sap.ushell.services.URLParsing");
jQuery.sap.require("sap.secmon.ui.commons.UIStateUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.TileURLUtils");

sap.ui.controller("sap.secmon.ui.m.commons.BookmarkCreatorDialog", {

    SERVICE_REFRESH_INTERVAL : 3600,
    CONFIG : {
        Alert : {
            serviceUrl : '/sap/secmon/services/ui/m/alerts/AlertCountFLPService.xsjs',
            icon : 'sap-icon://alert'
        },
        Investigation : {
            serviceUrl : '/sap/secmon/services/ui/m/invest/InvestigationCountFLPService.xsjs',
            icon : 'sap-icon://Fiori2/F0317'
        },
        SemanticEvent : {
            icon : 'sap-icon://Fiori4/F0576'
        },
        PatternExecution : {
            icon : 'sap-icon://arrow-right'
        },
        Exemptions : {
            serviceUrl : '/sap/secmon/services/ui/m/alertexceptions/AlertExceptionCountFLPService.xsjs'
        },
        Pattern : {
            serviceUrl : '/sap/secmon/services/ui/m/patterns/JSONPatternCountFLPService.xsjs',
            icon : 'sap-icon://puzzle'
        },
        Changelog : {
            icon : 'sap-icon://activity-individual'
        },
        ConfigurationCheck : {}
    },

    oDialog : null,
    oEditModel : null,
    oViewSettings : null,

    onInit : function() {
    },

    /**
     * open a dialog to save a bookmark. The values are taken from parameters.
     * 
     * @param oParentView:
     *            needed to open a dialog popup
     * @param sSuggestedBookmarkTitle
     *            suggested title for bookmark
     * @param oParameters
     *            parameter object. Example: {status:[HIGH, VERY_HIGH]}
     * @param sObjectType
     *            either "Investigation" or "Alert"; Used to select the icon and count-service. Parameter is optional, default is "Alert".
     * 
     */
    openDialog : function(oParentView, sSuggestedBookmarkTitle, oParameters, sObjectType) {

        this.oParameters = oParameters;
        if (sObjectType === undefined) {
            sObjectType = 'Alert';
        }
        this.oConfig = this.CONFIG[sObjectType];

        if (!this.oDialog) {
            this.oDialog = sap.ui.xmlfragment("sap.secmon.ui.m.commons.BookmarkCreatorDialog", this);
            oParentView.addDependent(this.oDialog);
        }

        this.oEditModel = new sap.ui.model.json.JSONModel();
        var oData = {
            title : sSuggestedBookmarkTitle,
            subtitle : "",
            info : ""
        };
        this.oEditModel.setData(oData);

        this.oDialog.setModel(this.oEditModel, "editModel");
        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", oParentView, this.oDialog);
        this.oDialog.open();
    },

    onOk : function(oEvent) {
        this.oDialog.close();
        this._createBookmark();
    },

    onCancel : function(oEvent) {
        this.oDialog.close();
    },

    /**
     * Create bookmark with a semantic object (i.e. the tile opens in-place) and with a service URL (i.e. the tile is a dynamic tile with a count service on the back end).
     */
    _createBookmark : function() {
        var oData = this.oEditModel.getData();

        var bookmarkService = sap.ushell.Container.getService("Bookmark");
        // the current document URL might not contain requested parameters.
        // We need to explicitly set them.
        var sHash = sap.secmon.ui.m.commons.TileURLUtils.createHashWithParams(this.oParameters);

        var oBookmarkRequest = {
            title : oData.title,
            subtitle : oData.subtitle,
            info : oData.info,
            icon : this.oConfig.icon,
            url : sHash
        // using the hash causes the link to open in-place
        };

        if (this.oConfig.serviceUrl) {
            // The service URL created may contain parameters "orderBy" and
            // "orderDesc".
            // This is okay as the alert count service ignores those parameters.
            oBookmarkRequest.serviceUrl = sap.secmon.ui.m.commons.TileURLUtils.createServiceUrlWithParams(this.oConfig.serviceUrl, this.oParameters);
            oBookmarkRequest.serviceRefreshInterval = this.SERVICE_REFRESH_INTERVAL;
        }

        var promise = bookmarkService.addBookmark(oBookmarkRequest);

        var that = this;
        promise.done(function() {
            sap.m.MessageToast.show(that.getCommonText("MBookmark_SuccessXMSG"));
        }).fail(function(args) {
            sap.m.MessageToast.show(that.getCommonText("MBookmark_FailureXMSG"));
        });

    },

    getText : function(sTextKey) {
        return this.oDialog.getModel("i18n").getProperty(sTextKey);
    },
    getCommonText : function(sTextKey) {
        return this.oDialog.getModel("i18nCommon").getProperty(sTextKey);
    },

});