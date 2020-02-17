$.sap.declare("sap.secmon.ui.browse.DependsOnSubsetCard");

$.sap.require("sap.secmon.ui.browse.AbstractValueSelector");
$.sap.require("sap.ui.commons.AutoCompleteRenderer");
$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.browse.Constants");

sap.secmon.ui.browse.AbstractValueSelector.extend("sap.secmon.ui.browse.DependsOnSubsetCard", {

    metadata : {

        properties : {
            bindingPath : {
                type : "string",
            }
        },

        aggregations : {},

        events : {
            change : {
                newValue : undefined
            },
        }
    },

    _oFilterCard : undefined,
    _oPathSelect : {},
    _oSubsetSelect : {},
    _oFieldSelect : {},

    _iSelectedPath : 0,
    _iSelectedSubset : 0,

    _handleFilterCardClosed : function(oData) {
        // validate all fields
        // 1. path

        // alert("FilterCardClosed->DependsOnSubsetCard");
    },

    _loadReferencedFieldModel : function(sPathLuid, sSubsetLuid) {

        var thisControl = this;

        var oWorkspaceData = sap.ui.getCore().getModel('WorkspaceModel').getData();
        var iPathIdx = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oWorkspaceData);

        var promise = sap.secmon.ui.browse.utils.getController()._oCache.getData([ {
            context : oWorkspaceData.paths[iPathIdx].context,
            subsetId : "Path" + sPathLuid + ".Subset" + sSubsetLuid
        } ], oWorkspaceData);

        promise.done(function(response, textStatus, XMLHttpRequest) {
            thisControl.getModel("ReferencedFieldModel").setData(response);

            // reset the selected reference
            thisControl.getModel().setProperty("/valueRange/searchTerms", []);

            thisControl._updateRefFieldSelection();
        });
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
        });
    },

    _updatePathSelection : function(selectedPathLuid) {

        var sPathLuid;
        var sSubsetLuid = "";
        var sSubsetIdx = "0";
        var oAvailableSubsetsModel = this.getModel("AvailableSubsetsModel");

        if (selectedPathLuid === undefined || selectedPathLuid === "") {
            var oSelectedFilterModel = this.getModel();
            var sCurrSelection = oSelectedFilterModel.getProperty("/valueRange/searchTerms/0");
            if (sCurrSelection === undefined || sCurrSelection === "") { // new
                sPathLuid = oAvailableSubsetsModel.getProperty("/paths/0/luid");
            } else { // edit mode
                var aBuf = sCurrSelection.split(".");
                var aPath = aBuf[0].split("Path");
                sPathLuid = aPath[1];
                var aSubset = aBuf[1].split("Subset");
                sSubsetLuid = aSubset[1];
            }
        } else {
            sPathLuid = selectedPathLuid;
        }
        this._oPathSelect.setSelectedKey(sPathLuid);

        var sPathIdx = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oAvailableSubsetsModel.getData());
        if (sSubsetLuid !== "") {
            sSubsetIdx = sap.secmon.ui.browse.utils.getSubsetIdxByLuid(sSubsetLuid, sPathIdx, oAvailableSubsetsModel.getData());
        }

        var oTemplate = new sap.ui.core.ListItem();
        oTemplate.bindProperty("text", {
            path : "AvailableSubsetsModel>luid",
            formatter : function(value) {
                return "Subset" + value;
            }
        });
        oTemplate.bindProperty("key", {
            path : "AvailableSubsetsModel>luid"
        });

        this._oSubsetSelect.bindAggregation("items", "AvailableSubsetsModel>/paths/" + sPathIdx + "/filters/", oTemplate);
        sSubsetLuid = oAvailableSubsetsModel.getProperty("/paths/" + sPathIdx + "/filters/" + sSubsetIdx + "/luid");
        this._oSubsetSelect.setSelectedKey(sSubsetLuid);

        this._loadReferencedFieldModel(sPathLuid, sSubsetLuid);
    },

    _updateRefFieldSelection : function(oSelectedItem) {

        var oSelectedFilterModel = this.getModel();

        var sPath = "Path" + this._oPathSelect.getSelectedKey();
        var sSubset = "Subset" + this._oSubsetSelect.getSelectedKey();
        var sSelectedRefFieldDispName = "";
        var sSelectedRefFieldKey = "";

        // init in NEW/EDIT mode
        if (oSelectedItem === undefined || oSelectedItem === null) {

            var sCurrSelection = oSelectedFilterModel.getProperty("/valueRange/searchTerms/0");

            if (sCurrSelection === undefined || sCurrSelection === "") { // new
                sSelectedRefFieldDispName = oSelectedFilterModel.getProperty("/displayName");
                sSelectedRefFieldKey = oSelectedFilterModel.getProperty("/key");
            } else { // edit mode
                var aBuf = sCurrSelection.split(".");
                sSelectedRefFieldDispName = aBuf[2];
                sSelectedRefFieldKey = oSelectedFilterModel.getProperty("/valueRange/searchTermRefKeys/0");
            }

            this._oRefFieldSelect.setSelectedKey(sSelectedRefFieldKey);

        } else { // handle change
            sSelectedRefFieldDispName = oSelectedItem.getText();
            sSelectedRefFieldKey = oSelectedItem.getKey();
        }

        var sNewValue = sPath + "." + sSubset + "." + sSelectedRefFieldDispName;

        oSelectedFilterModel.setProperty("/valueRange/searchTerms", [ sNewValue ]);
        oSelectedFilterModel.setProperty("/valueRange/searchTermRefKeys", [ sSelectedRefFieldKey ]);
        // oSelectedFilterModel.setProperty("/valueRange/operator", "=");
    },

    layout : undefined,

    _buildUI : function() {

        // fetch the layout control from the AbstractValueSelector (inherited)
        this.layout = sap.secmon.ui.browse.AbstractValueSelector.prototype.getAggregation.call(this, "layout");

        // TODO; clear the Matrix ???
        this.layout.removeAllRows();

        var oOperator = new sap.m.Select({
            selectedKey : "{/valueRange/operator}",
            items : {
                path : "/filterOperators",
                template : new sap.ui.core.ListItem({
                    key : "{}",
                    text : "{}"
                })
            }
        });

        this.layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                content : new sap.m.Label({
                    text : "{i18n>BU_LBL_Operator}",
                })
            }), new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                content : oOperator
            }) ]
        }));

        this._oPathSelect = new sap.m.ComboBox({
            visible : true,
            width : "200px",
            items : {
                path : "AvailableSubsetsModel>/paths",
                factory : function(sId, oContext) {
                    var sLuid = oContext.getProperty("luid");
                    return new sap.ui.core.ListItem(sId, {
                        text : "Path" + sLuid,
                        key : sLuid
                    });
                },
            },
            selectionChange : [ function(oEvent) {
                var oItem = oEvent.getParameters().selectedItem;
                var sPathLuid = oItem.getKey();
                this._updatePathSelection(sPathLuid);
            }, this ]
        });

        this._oSubsetSelect = new sap.m.ComboBox({
            selectionChange : [ function(oEvent) {
                var oItem = oEvent.getParameters().selectedItem;
                var sSubsetLuid = oItem.getKey();
                var sPathLuid = this._oPathSelect.getSelectedKey();
                this._loadReferencedFieldModel(sPathLuid, sSubsetLuid);
            }, this ]
        });

        this.layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                content : new sap.m.Label({
                    text : "{i18n>BU_LBL_Ref_Path}",
                })
            }), new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                content : this._oPathSelect
            }) ]
        }));

        this.layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                content : new sap.m.Label({
                    text : "{i18n>BU_LBL_Ref_Subset}",
                })
            }), new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                content : this._oSubsetSelect
            }) ]
        }));

        this._oRefFieldSelect = new sap.m.ComboBox({
            items : {
                path : "ReferencedFieldModel>/data/",
                template : new sap.ui.core.ListItem({
                    key : "{ReferencedFieldModel>key}",
                    text : "{ReferencedFieldModel>displayName}",
                    tooltip : "{ReferencedFieldModel>description}",
                    enabled : {
                        path : 'ReferencedFieldModel>key',
                        formatter : function(value) {
                            return Object.keys(sap.secmon.ui.browse.Constants.C_ROLE_INDEPENDENT_ATTRIBUTES).indexOf(value) === -1;
                        }
                    }
                })
            },
            selectionChange : [ function(oEvent) {
                var oSelectedItem = oEvent.getParameters().selectedItem;
                this._updateRefFieldSelection(oSelectedItem);
            }, this ],

        });

        this.layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                content : new sap.m.Label({
                    text : "{i18n>BU_LBL_Ref_Field}",
                })
            }), new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                content : this._oRefFieldSelect
            }) ]
        }));

        // this.setAggregation("layout", this.layout);
    },

    init : function() {
        // call the init() of our super control
        if (sap.secmon.ui.browse.AbstractValueSelector.prototype.init) {
            sap.secmon.ui.browse.AbstractValueSelector.prototype.init.call(this);
        }

        if (sap.secmon.ui.browse.AbstractValueSelector.prototype._registerFilterCardCloseEvent) {
            sap.secmon.ui.browse.AbstractValueSelector.prototype._registerFilterCardCloseEvent.call(this);
        }

        var oSelectedFilterModel = sap.ui.getCore().getModel('SelectedFilterModel');
        this.setModel(oSelectedFilterModel);

        var oReferencedFieldModel = new sap.ui.model.json.JSONModel();
        oReferencedFieldModel.setSizeLimit(sap.secmon.ui.browse.Constants.C_MODEL_SIZE_LIMIT.FIELD_LIST);
        this.setModel(oReferencedFieldModel, "ReferencedFieldModel");

        // TODO: workaround to allow AbstractValueSelector to access
        // ReferencedFieldModel
        sap.ui.getCore().setModel(oReferencedFieldModel, "ReferencedFieldModel");

        var oWorkspaceModel = sap.ui.getCore().getModel('WorkspaceModel');
        var oData = $.extend(true, {}, oWorkspaceModel.getData());

        var aBuf = oSelectedFilterModel.getData().workspaceContext.split(".");
        var aPath = aBuf[0].split("Path");
        var sPathLuid = aPath[1];
        var iPathIdx = parseInt(sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oData));

        // remove the current path where the reference should be defined
        oData.paths.splice(iPathIdx, 1);

        // remove the paths which contain empty subsets. Must be looped
        // reversely to avoid inconsistency
        var i = oData.paths.length;
        while (i--) {
            if (oData.paths[i].filters && oData.paths[i].filters.length === 0) {
                oData.paths.splice(i, 1);
            }
        }

        var oAvailableSubsetsModel = new sap.ui.model.json.JSONModel();
        oAvailableSubsetsModel.setData(oData);
        this.setModel(oAvailableSubsetsModel, "AvailableSubsetsModel");

        this._buildUI();
        this._updatePathSelection();
    },

    onBeforeRendering : function() {

    },

    renderer : sap.secmon.ui.browse.AbstractValueSelectorRenderer,

});
