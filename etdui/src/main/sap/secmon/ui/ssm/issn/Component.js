jQuery.sap.registerModulePath("sap.secmon", "/sap/secmon");
jQuery.sap.registerModulePath("sap.secmon.ui.browse", "/sap/secmon/ui/browse/ui");
jQuery.sap.registerModulePath("sap.secmon.ui.ssm.issn", "/sap/secmon/ui/ssm/issn");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/ssm/issn/themes/sap_blue_crystal/library.css");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.ssm.issn.Component", {

    metadata : {
        name : "DesignUI",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.commons", "sap.ui.table", "sap.ui.layout", "sap.ui.unified", "sap.ui.core", "sap.m", "sap.ui.fl" ],
            components : []
        },
        handleValidation : true,
        rootView : "sap.secmon.ui.ssm.issn.App",
        config : {
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/UIText.hdbtextbundle", "SSM_TIT_ImplStatOV"),
            resourceBundle : "/sap/secmon/ui/UIText.hdbtextbundle",
            serviceConfig : {
                name : "ImplementationStatusOverview",
                serviceUrl : "/sap/secmon/services/NoteSystemOverview.xsodata"
            },
            systems : {
                name : "systems",
                serviceUrl : "/sap/secmon/services/ui/systemcontext/SystemData.xsodata"
            },
            types : {
                name : "DistinctSystemType",
                serviceUrl : "/sap/secmon/services/NoteSystemOverview.xsodata"
            },
            backendConfig : {
                loadCSRFToken : true,
                loadHanaUsers : false,
                loadEnums : "sap.secmon.ui.ssm",
            },
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.ssm.issn",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "ImplStatusOverview",
                viewLevel : 0,
                viewType : 'XML',
                targetControl : "idAppControl"
            } ]
        },
    },
    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);
        this.oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter());

        // var sMode = $.sap.getUriParameters().get('etdMode');

        this.setDefaultODataModel("serviceConfig");
        this.setODataModel("systems");

        // if (sMode && sMode === 'Test') {
        // var oModel = new sap.ui.model.odata.ODataModel("/system-local/etd/ssm/ssm.xsodata", true);
        // oModel.attachRequestFailed(this.oCommons.handleRequestFailed);
        // this.setModel(oModel);
        // }

    },

    onComponentReady : function() {
        // this.setupRouting();
        this.getRouter().initialize();
    },

    onAfterRendering : function() {
        // set FS mode on desktop if the requirements are met
        if (this.oContainer) {
            var oParent = (this.oContainer.getParent ? this.oContainer.getParent() : null);
            if (oParent) {
                oParent = (oParent.getParent ? oParent.getParent() : null);

                if (oParent.setAppWidthLimited) {
                    oParent.setAppWidthLimited(!sap.ui.Device.system.desktop);
                }
            }

        }
    },

});
