//This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.valuelist.details.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.valuelist.details.Component", {
    NAMESPACES_SOURCE_URL : "/sap/secmon/services/NameSpacesOriginalInSystem.xsodata",

    metadata : {
        name : "ValuelistDetails",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.m", "sap.ui.layout" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.valuelist.view.OneViewApp",
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
                loadEnums : "sap.secmon.ui.m.valuelist"
            },
        },
        routing : {
            config : {
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.valuelist.view",
                targetControl : "idAppControl",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : "Detail/{ValuelistDetail}:?query:",
                name : "Detail",
                view : "Detail",
                viewLevel : 2
            } ]

        },
    },

    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        // load namespace model
        this.loadPatternNamespacesModel();
        var componentData = this.getComponentData();
        this.valuelistId = null;
        if (componentData !== null && componentData !== undefined) {
            this.valuelistId = componentData.startupParameters.Id[0];
        }
        // Create it in the component: For the master-detail layout it is shared between master view and detail view.
        // For the fullscreen layout it is created in the component as well.
        this.createEditModel();
    },

    onComponentReady : function() {

        this.setDefaultODataModel("serviceConfig");

        var router = this.getRouter();
        router.initialize();
        var bindingPath = "Header(X'" + this.valuelistId + "')";
        router.navTo("Detail", {
            ValuelistDetail : bindingPath,
            query : {
                fullscreen : "true"
            }
        }, true);
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
    
    createEditModel : function() {
        var editModel = new sap.ui.model.json.JSONModel({editMode: false, displayMode: true});
        this.setModel(editModel, "editModel");
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
    },

});
