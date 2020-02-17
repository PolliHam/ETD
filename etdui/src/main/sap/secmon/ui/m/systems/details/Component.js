//This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../../sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.systems.details.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/systems/css/eventtrendanalysisFullScreen.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/systems/css/systems.css");

/*
 * This component displays system details view full screen.
 */
sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.systems.details.Component", {

    metadata : {
        name : "SystemDetails",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.m", "sap.ui.layout", "sap.viz" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.systems.view.OneViewApp",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/systems/i18n/UIText.hdbtextbundle", "MSystems_App_Title"),
            resourceBundle : "/sap/secmon/ui/m/systems/i18n/UIText.hdbtextbundle",
            systemDataConfig : {
                name : "SystemData",
                serviceUrl : "/sap/secmon/services/ui/systemcontext/SystemData.xsodata"
            },
            backendConfig : {
                loadCSRFToken : false,
                loadEnums : "sap.secmon.services.ui.systemcontext",
                loadHanaUsers : false
            }
        },
        routing : {
            config : {
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.systems.view",
                targetControl : "idAppControl",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : "system/{system}/:tab::?query:",
                name : "system",
                view : "Detail",
                viewLevel : 2
            } ]
        },
    },
    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);

        var componentData = this.getComponentData();
        this.system = null;
        this.type = null;
        if (componentData !== null && componentData !== undefined) {
            this.system = encodeURIComponent(componentData.startupParameters.system[0]);
            if (componentData.startupParameters.type && componentData.startupParameters.type !== null && componentData !== undefined) {
                this.type = componentData.startupParameters.type[0];
            }
            if (componentData.startupParameters.tab && componentData.startupParameters.tab !== null && componentData !== undefined) {
                this.tab = componentData.startupParameters.tab[0];
            }
        }

        this.setDefaultODataModel("systemDataConfig");
    },

    onComponentReady : function() {
        var router = this.getRouter();
        router.initialize();

        var component = this;

        this.getSystem(this.system, this.type).done(function(response) {
            if (response.systems && response.systems[0]) {

                var systemId = encodeURIComponent(response.systems[0].Id);
                var systemType = response.systems[0].Type;
                var bindingPath = "SystemHeader(Id='" + systemId + "',Type='" + systemType + "')";
                router.navTo("system", {
                    system : bindingPath,
                    tab : component.tab,
                    query : {
                        fullscreen : "true"
                    }
                }, true);
            } else {
                sap.m.MessageBox.alert(component.getModel("i18n").getProperty("MSystems_UnknownSystem"), {
                    title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                });
            }
        }).fail(function() {
            sap.m.MessageBox.alert(component.getModel("i18n").getProperty("MSystems_LoadingError"), {
                title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
            });
        });
    },

    /**
     * Loads the System Id and System Type by a given systemId, e.g. 'S74/000'.
     */
    getSystem : function(systemId, systemType) {
        if (typeof systemType === "string") {
            return $.ajax({
                url : "/sap/secmon/services/ui/m/systems/SystemById.xsjs?system=" + systemId + "&type=" + systemType,
                dataType : "json"
            });
        } else {
            return $.ajax({
                url : "/sap/secmon/services/ui/m/systems/SystemById.xsjs?system=" + systemId,
                dataType : "json"
            });
        }
    }

});
