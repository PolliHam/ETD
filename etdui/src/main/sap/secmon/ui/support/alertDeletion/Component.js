//This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon.ui", "/sap/secmon/ui");
jQuery.sap.declare("sap.secmon.ui.support.alertDeletion.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.support.alertDeletion.Component", {

    metadata : {
        "library" : "sap.secmon.ui.support.alertDeletion",
        "version" : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        "includes" : [],
        "dependencies" : {
            "libs" : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl" ],
            "components" : []
        },
        rootView : "sap.secmon.ui.support.alertDeletion.overview",
        "config" : {
            // Will be used by the FLP as title in browser
            "title" : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/support/alertDeletion/i18n/UIText.hdbtextbundle", "AlertDeletion_XLBL"),

            resourceBundle : "/sap/secmon/ui/support/alertDeletion/i18n/UIText.hdbtextbundle",

            backendConfig : {
                loadCSRFToken : true
            }
        },
        // this component does not embed a navigatable app (SplitApp or NavApp),
        // we use the custom router to inject component parameters
        routing : {
            config : {
                // injects component data into route parameters
                viewPath : "sap.secmon.ui.support.alertDeletion",
                targetControl : "mainControl",
            },
            routes : [ {
                // used to read URL parameters
                pattern : ":?query:",
                viewPath : "sap.secmon.ui.support.alertDeletion",
                view : "overview",
                name : "catchall"
            } ]
        }
    },

    /**
     * !!! The steps in here are sequence dependent !!!
     */
    init : function() {

        // Caution: Correct functioning depends on strict order of statements.

        // Precondition:
        // Statements registerModulePath, registerResourcePath, and require
        // must have been done at the beginning of this file.

        // 1. call overridden init (calls createContent)
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);

        // 2. initialize the router with component data.
        // In case that the component is embedded in Fiori launchpad the
        // parameters are found in property "startupParameters".
        var router = this.getRouter();

        router.initialize();
    }

});
