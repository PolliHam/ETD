// This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/ViewSettingsStyle.css");

var ADependencies = [ "sap/secmon/ui/m/commons/RoutingParameterHelper", "sap/m/routing/RouteMatchedHandler", "sap/secmon/ui/m/commons/EtdComponent", "sap/secmon/ui/commons/TextUtils" ];

sap.ui.define(ADependencies, function(RoutingParameterHelper, RouteMatchedHandler, EtdComponent, TextUtils) {
    "use strict";

    /**
     * <pre>
     * The component accepts the following query parameters:
     * 
     * pattern=hexadecimal 
     * pattern ID 
     * alert= hexadecimal alert ID 
     * severity=severity of selected alerts 
     * status=status of selected alerts 
     * processor=processor of* selected alerts or empty for logged on user 
     * ageInHours=time range in hours (back from now) for selected alert creation date
     * 
     * The parameters are currently only taken into account for the &quot;alerts&quot;
     * screen.
     * </pre>
     */
    return EtdComponent.extend("sap.secmon.ui.m.alerts.Component", {

        metadata : {
            dependencies : {
                libs : [ "sap.m", "sap.ui.layout", "sap.ui.fl", "sap.ui.comp", "sap.viz" ],
                components : []
            },
            rootView : "sap.secmon.ui.m.alerts.App",
            config : {
                resourceBundle : "/sap/secmon/ui/m/alerts/i18n/UIText.hdbtextbundle",
                // Will be used by the FLP as title in browser
                title : TextUtils.getText("/sap/secmon/ui/m/alerts/i18n/UIText.hdbtextbundle", "MobAlert_Alerts_Title"),
                backendConfig : {
                    loadCSRFToken : true,
                    loadEnums : "sap.secmon.services.ui,sap.secmon.ui.browse",
                    loadHanaUsers : false,
                    loadPatternDefinitions : true,
                    loadKnowledgeBaseTexts : true
                }
            },
            routing : {

                config : {
                    /*
                     * This custom router injects component data into route parameters. Caution: The require statement must have been done prior to declaration of className! Otherwise, the standard
                     * router is instantiated.
                     */
                    routerClass : sap.ui.core.routing.Router,
                    viewType : "XML",
                    viewPath : "sap.secmon.ui.m.alerts",
                    clearTarget : false,
                    transition : "slide"
                },
                routes : [ {
                    pattern : "alerts/:?query:",
                    name : "alerts",
                    viewType : "XML",
                    view : "Alerts",
                    viewPath : "sap.secmon.ui.m.alerts",
                    viewLevel : 0,
                    preservePageInSplitContainer : true,
                    targetAggregation : "masterPages",
                    targetControl : "splitApp",
                    subroutes : [ {
                        pattern : "alert/:?query:",
                        name : "alert",
                        view : "Alert",
                        viewPath : "sap.secmon.ui.m.alerts",
                        viewType : "XML",
                        viewLevel : 2,
                        targetAggregation : "detailPages"
                    }, {
                        pattern : "noalert/:?query:",
                        name : "noAlert",
                        view : "Empty",
                        viewPath : "sap.secmon.ui.m.alerts",
                        viewType : "XML",
                        viewLevel : 2,
                        targetAggregation : "detailPages"
                    } ]
                }, {
                    viewPath : "sap.secmon.ui.m.alerts",
                    viewLevel : 0,
                    viewType : "XML",
                    view : "Alerts",
                    name : "catchall" // name used for listening
                // or navigating to
                // this route
                } ]
            }
        },

        /**
         * !!! The steps in here are sequence dependent !!!
         */
        init : function() {

            EtdComponent.prototype.init.apply(this, arguments);

            // Initialize the router with component data.
            // In case that the component is embedded in Fiori
            // launchpad the
            // parameters are found in property "startupParameters".
            var router = this.getRouter();
            var componentData = this.getComponentData();
            if (componentData) {
                var oRoutingParameterHelper = new RoutingParameterHelper();

                // QuickFix for HANA Revision 94+, ServiceURL does
                // not transform <ME> to SessionUser anymore
                if (componentData.startupParameters &&
                        ($.isArray(componentData.startupParameters.processor) && componentData.startupParameters.processor.length > 0 && (componentData.startupParameters.processor[0] === "<ME>" ||

                        decodeURIComponent(componentData.startupParameters.processor[0]) === "<ME>"))) {

                    componentData.startupParameters.processor = this.oCommons.getSessionUser();
                }

                oRoutingParameterHelper.setHashFromParametersIfHashIsEmpty(componentData.startupParameters, "alerts");
            }
            this.routeHandler = new RouteMatchedHandler(router);
        },

        destroy : function() {
            if (this.routeHandler) {
                this.routeHandler.destroy();
            }

            EtdComponent.prototype.destroy.apply(this, arguments);
        },

        onComponentReady : function() {
            this.getRouter().initialize();
        },

    });

});
