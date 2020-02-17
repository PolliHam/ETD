$.sap.declare("sap.secmon.ui.browse.Namespace");
$.sap.require("sap.secmon.ui.browse.utils");
jQuery.sap.require("sap.ui.model.odata.CountMode");

var C_ODATA_NAMESPACE = {
    URL : "sap/secmon/services",
    SERVICE : "NameSpacesOriginalInSystem.xsodata",
    RESOURCE : "NameSpaceOriginalInSystem"
};

var C_MODEL_SIZE_LIMIT = {
    FIELD_LIST : 500,
    VALUE_LIST : 500,
    TRIGGER_LIST : 500,
};

/**
 * Custom control to manage Namespace. It takes care of saving the newly created namespace in the backend, and make it transparent to the user.
 * 
 * Persisting to the backend must be triggered explicitly by calling the function persist: oNamespaceControl.persist(sNamespace, function(bSent){}, function(oError){})
 * 
 * @see: Workspace.js for how to use (search for WorkspaceSaveAs)
 */

sap.m.ComboBox.extend("sap.secmon.ui.browse.Namespace", {

    metadata : {
        properties : {
            oldNamespace : {
                type : "string",
            },
        },

        aggregations : {},

        events : {}
    },

    /**
     * Bind the view with oData Model of Namespaces. Note: default size of data in mode is 100 -> must be extended
     */
    init : function() {

        // Call super constructor
        if (sap.m.ComboBox.prototype.init) {
            sap.m.ComboBox.prototype.init.apply(this, arguments);
        }

        var oModel = new sap.ui.model.odata.ODataModel("/" + C_ODATA_NAMESPACE.URL + "/" + C_ODATA_NAMESPACE.SERVICE, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }); // use json format
        oModel.setSizeLimit(C_MODEL_SIZE_LIMIT.FIELD_LIST);
        this.setModel(oModel, "NamespaceModel");

        this.bindItems("NamespaceModel>/" + C_ODATA_NAMESPACE.RESOURCE, new sap.ui.core.ListItem({
            text : "{NamespaceModel>NameSpace}"
        }), new sap.ui.model.Sorter("NameSpace"));
    },

    /**
     * Callbacks fnOk is called if sNamespaec is processed correctly. If it is found in the backend, nothing is stored and the bSent is set to be false, otherwise the new namspace will be stored in
     * the backend and bSent set to be true. In error case the fnFail is called with oError as parameter
     */
    persist : function(fnOk, fnFail) {
        var sNamespace = this.getValue();
        if (sNamespace.substring(0, 7) !== "http://") {
            this.setValueState(sap.ui.core.ValueState.Error);
            fnFail.call(this, {
                "textId" : "BU_MSG_NSWrongFormat",
                "namespace" : sNamespace
            });
        } else {
            var aItems = this.getItems();
            for (var i = 0, len = aItems.length; i < len; i++) {
                if (aItems[i].getText() === sNamespace) {
                    fnOk.call(this, {
                        "sent" : false,
                        "textId" : "BU_MSG_NSSaveOk",
                        "namespace" : sNamespace
                    });
                    return;
                }
            }
            this._save(sNamespace, fnOk, fnFail);
        }
    },

    fireChange : function(oEvent) {
        var sNamespace = oEvent.newValue;
        if (sNamespace.substring(0, 7) !== "http://") {
            this.setValueState(sap.ui.core.ValueState.Error);
        } else {
            this.setValueState(sap.ui.core.ValueState.None);
        }
    },

    _save : function(sNamespace, fnOk, fnFail) {
        var thisControl = this;

        // now insert into the backend
        var oModel = this.getModel("NamespaceModel");

        var oEntry = {
            Id : sap.secmon.ui.browse.utils.CommonFunctions.hexToBase64(sap.secmon.ui.browse.utils.generateGUID()),
            NameSpace : sNamespace,
        };

        oModel.create('/' + C_ODATA_NAMESPACE.RESOURCE, oEntry, null, function() {
            thisControl.setOldNamespace(sNamespace);
            fnOk.call(this, {
                "sent" : true,
                "textId" : "BU_MSG_NSSaveOk",
                "namespace" : sNamespace
            });
        }, function(oError) {
            thisControl.setValue(thisControl.getOldNamespace());
            fnFail.call(this, {
                "textId" : "BU_MSG_NSSaveFailed",
                "namespace" : sNamespace
            });
        });
    },

    renderer : {},

    onBeforeRendering : function() {
        this.setOldNamespace(this.getValue());

        // var oBinding = this.getBinding("value");
        // if (!oBinding.getType()) {
        // oBinding.setType(new sap.ui.model.type.String(null, {
        // startsWith : "http://"
        // }));
        // }
    }

});