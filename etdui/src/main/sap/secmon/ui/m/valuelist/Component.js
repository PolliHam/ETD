//This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.valuelist.Component");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.VetoCollector");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.valuelist.Component", {
    NAMESPACES_SOURCE_URL : "/sap/secmon/services/NameSpacesOriginalInSystem.xsodata",

    metadata : {
        name : "Valuelist",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.valuelist.view.App",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/valuelist/i18n/UIText.hdbtextbundle", "VL_Config_Title"),
            resourceBundle : "/sap/secmon/ui/m/valuelist/i18n/UIText.hdbtextbundle",
            serviceConfig : {
                name : "Valuelists",
                serviceUrl : "/sap/secmon/services/ui/m/valuelist/valuelist.xsodata"
            },
            backendConfig : {
                loadCSRFToken : true,
                loadEnums : "sap.secmon.ui.m.valuelist",
            },
        },
        routing : {
            config : {
                // injects component data into route parameters
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.valuelist.view",
                targetAggregation : "detailPages",
                clearTarget : false
            },
            routes : [ {
                // master detail layout: master (list of valuelists), detail (selected valuelist)
                // Hash looks like
                // #Valuelist-show&/valuelist/Header('1553BAD5CA09E440B378573E143A6CBE')/?tab=values&mode=display
                pattern : ":?query:",
                name : "main",
                view : "Master",
                viewLevel : 0,
                targetAggregation : "masterPages",
                targetControl : "idAppControl",
                subroutes : [ {
                    pattern : "valuelist/{ValuelistDetail}/:?query:",
                    name : "valuelist",
                    view : "Detail",
                    viewLevel : 1
                }, {
                    pattern : "createValuelist",
                    name : "createValuelist",
                    view : "CreateValuelist",
                    viewLevel : 1
                } ]
            } ]
        },
    },

    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.setDefaultODataModel("serviceConfig");
        // load namespace model
        this.loadPatternNamespacesModel();
        // Create it in the component: It is shared between master view and detail view.
        this.createEditModel();
    },

    onComponentReady : function() {
        // sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this,
        // arguments);

        this.setDefaultODataModel("serviceConfig");

        this.routeHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter());

        // Must be done last: It initializes any views that match the initial
        // route. Models and bindings must have been set up.
        this.getRouter().initialize();
    },
    
    createEditModel : function() {
        var editModel = new sap.ui.model.json.JSONModel({editMode: false, displayMode: true});
        this.setModel(editModel, "editModel");
    },

    /**
     * Reads Namespaces and puts them into json Model
     */
    loadPatternNamespacesModel : function() {
        var component = this;
        var oNameSpaceModel = new sap.ui.model.json.JSONModel();
        component.setModel(oNameSpaceModel, "nameSpaces");

        this.oCommons.loadDistinctValuesOfColumn(component.NAMESPACES_SOURCE_URL, "NameSpaceOriginalInSystem", "NameSpace").done(function(aNameSpaces) {

            var oNamespaceModel = component.getModel("nameSpaces");
            oNamespaceModel.setData({
                NameSpaces : aNameSpaces
            });
            component.noOfNs = aNameSpaces.length;
            aNameSpaces.sort(function(a, b) {
                a = a.NameSpace.toLowerCase();
                b = b.NameSpace.toLowerCase();
                if (a < b) {
                    return -1;
                }
                if (a > b) {
                    return 1;
                }
                return 0;
            });
        });

    },

    checkNamespacesExist : function() {
        var component = this;
        var oI18nModel = component.getModel("i18n");
        var oI18nCommonModel = component.getModel("i18nCommon");
        if (component.noOfNs === 0) {
            sap.m.MessageBox.alert(oI18nModel.getProperty("VL_NewConfig_NoNS_msg"), {
                title : oI18nCommonModel.getProperty("Error_TIT")
            });
            return false;
        } else {
            return true;
        }
    }

});
