$.sap.declare("sap.secmon.ui.m.anomaly.ui.AnomalyPatterns");
$.sap.require("sap.secmon.ui.m.anomaly.ui.AnomalyObjectPanel");
$.sap.require("sap.secmon.ui.m.anomaly.ui.ObjectsExplorer");
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
$.sap.require("sap.secmon.ui.m.anomaly.ui.Formatter");
jQuery.sap.require("sap.secmon.ui.m.anomaly.ui.Constants");
jQuery.sap.require("sap.ui.model.odata.CountMode");

/**
 * 
 * @memberOf sap.secmon.ui.anomaly.AnomalyPatterns
 */
sap.ui.core.Control.extend("sap.secmon.ui.m.anomaly.ui.AnomalyPatterns", {

    metadata : {
        properties : {
            title : {
                type : "string"
            }
        },
        aggregations : {
            _layout : {
                type : "sap.m.Page",
                multiple : false
            }
        },
        events : {
            refreshRequested : {}
        }
    },

    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.AnomalyPatterns
     */
    _oTileContainer : undefined,
    _oPage : undefined,
    _oNNSLayout : undefined,

    /**
     * initialize models and controls
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.AnomalyPatterns
     */
    init : function() {
        // set UI model
        var oUIModel = new sap.ui.model.json.JSONModel();
        this.setModel(oUIModel, "UIModel");
        this._buildMainUI();
        // $(window).resize(function() {
        // _that._rebuildMLayout();
        // });
        this.setAggregation("_layout", this._oPage);
    },

    getText : function(sTextKey) {
        var parameters = Array.prototype.slice.call(arguments, 0), model = this.getModel("i18n").getResourceBundle();
        return model.getText.apply(model, parameters);
    },

    getCommonText : function(sTextKey) {
        var parameters = Array.prototype.slice.call(arguments, 0), model = this.getModel("i18nCommon").getResourceBundle();
        return model.getText.apply(model, parameters);
    },

    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.AnomalyPatternsace
     */
    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.writeClasses();
        oRm.addStyle("width", "100%");
        oRm.addStyle("height", "100%");
        oRm.writeStyles();
        oRm.write(">");
        oRm.renderControl(oControl.getAggregation("_layout"));
        oRm.write("</div>");
    },
    /**
     * initialize Object
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.AnomalyPatterns
     */
    initialize : function(Type, Id, Name, Namespace) {
        var _that = this;
        var oObjectModel = this.getModel("ObjectModel");
        // in case no params provided user defaultScenario
        var sURL = "/sap/secmon/ui/m/anomaly/ui/defaultScenario.json";
        if (Type && Id) {
            sURL = sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_CONFIGURATION_PATH + '?Type=' + Type + '&Id=' + Id;
        } else if (Type) {
            switch (Type) {
            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
                sURL = "/sap/secmon/ui/m/anomaly/ui/defaultFeature.json";
                break;
            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
                sURL = "/sap/secmon/ui/m/anomaly/ui/defaultPattern.json";
                break;
            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO:
                if (Name && Namespace) {
                    sURL = sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_CONFIGURATION_PATH + '?Type=' + Type + '&Name=' + encodeURIComponent(Name) + '&Namespace=' + encodeURIComponent(Namespace);
                    break;
                }
            }
        } else {
            switch (oObjectModel.getData().Type) {
            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
                sURL = "/sap/secmon/ui/m/anomaly/ui/defaultFeature.json";
                break;
            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
                sURL = "/sap/secmon/ui/m/anomaly/ui/defaultPattern.json";
                break;
            }
        }

        // update UI
        oObjectModel.loadData(sURL, null, false);
        var oObjectData = oObjectModel.getData();
        var aNamespacesOriginal = [], bIsNonOriginal;

        oObjectData.Content.forEach(function(content) {
            if (aNamespacesOriginal.length === 0) {
                if (content.Namespace && _that._isNSOriginal(content.Namespace) === false) {
                    content.IsNonOriginal = bIsNonOriginal = true;
                } else {
                    bIsNonOriginal = false;
                }
                aNamespacesOriginal.push({
                    ns : content.Namespace,
                    nonOriginal : bIsNonOriginal
                });
            } else {
                $.each(aNamespacesOriginal, function(index, value) {
                    if (aNamespacesOriginal.indexOf(value) === -1) {
                        if (content.Namespace && _that._isNSOriginal(content.Namespace) === false) {
                            content.IsNonOriginal = bIsNonOriginal = true;
                        } else {
                            bIsNonOriginal = false;
                        }
                        aNamespacesOriginal.push({
                            ns : content.Namespace,
                            nonOriginal : bIsNonOriginal
                        });
                    } else {
                        if (aNamespacesOriginal[index].nonOriginal === true) {
                            content.IsNonOriginal = aNamespacesOriginal[index].nonOriginal;
                        }
                    }
                });
            }
        });
        if (oObjectData.Namespace && _that._isNSOriginal(oObjectData.Namespace) === false) {
            oObjectData.IsNonOriginal = true;
        }
        oObjectModel.refresh(true);
    },
    /**
     * private methods
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.AnomalyPatterns
     */
    _buildMainUI : function() {
        var _that = this;
        this._oPage = new sap.m.Page({
            enableScrolling : false,
            title : {
                parts : [ {
                    path : "ObjectModel>/Type"
                }, {
                    path : "ObjectModel>/Name"
                }, {
                    path : "ObjectModel>/Namespace",
                } ],
                formatter : function(sType, sName, sNamespace) {
                    var type = _that._getUIText(sType);
                    if (sName && sNamespace) {
                        return type + ': ' + sNamespace + ': ' + sName;
                    } else {
                        return type + ': ' + sName;
                    }
                }
            },
            showHeader : true,
            headerContent : [ new sap.m.Button({
                icon : "sap-icon://edit",
                type : 'Transparent',
                tooltip : "{i18n>DefineNNS_TXT}",
                enabled : {
                    parts : [{
                        path : "applicationContext>/userPrivileges/anomalyDetectionWrite"
                    },{
                        path : "ObjectModel>/IsNonOriginal"
                    }],
                    formatter : function(bPrivilege, sValue) {
                        if (!bPrivilege || sValue) {
                            return false;
                        } else {
                            return true;
                        }
                    }
                },
                press : [ function(oEvent) {
                    this._editNameAndNamespace();
                }, this ]
            }), new sap.m.Button({
                icon : "sap-icon://sys-help-2",
                type : 'Transparent',
                tooltip : "{i18n>OpenHelp_TTP}",
                press : [ function(oEvent) {
                    window.open("/sap/secmon/help/649ef627fbae43418ef2a4871c264435.html");
                }, this ]
            }) ],
            showSubHeader : false
        });
        this._oTileContainer =
                new sap.m.TileContainer({
                    tiles : {
                        path : "/Content",
                        template : new sap.m.CustomTile({
                            content : [ new sap.secmon.ui.m.anomaly.ui.AnomalyObjectPanel({
                                id : "anomalyObjectPanel",
                                type : "{Type}",
                                nav2Evalutation : [ function(oEvent) {
                                    var view = this.getParent().getParent().getParent();
                                    sap.ui.core.UIComponent.getRouterFor(view).navTo("evaluation", {
                                        evaluationId : oEvent.getParameter("data").Id
                                    }, false);
                                }, this ],
                                nav2Analysis : [ function(oEvent) {
                                    var navigationName = "analysePattern";
                                    var param = {
                                        patternId : oEvent.getParameter("data").Id
                                    };
                                    var view = this.getParent().getParent().getParent();
                                    sap.ui.core.UIComponent.getRouterFor(view).navTo(navigationName, param, false);
                                }, this ],
                                removeMe : [ function(oEvent) {
                                    var oData = oEvent.getParameter("data");
                                    var oModel = this.getModel("ObjectModel");
                                    var aContent = oModel.getProperty("/Content");
                                    for (var i = 0; i < aContent.length; i++) {
                                        if (aContent[i] === oData) {
                                            aContent.splice(i, 1);
                                            break;
                                        }
                                    }
                                    oModel.setProperty("/Content", aContent);
                                }, this ],
                                update : [
                                        function(oEvent) {
                                            var oModel = this.getModel("ObjectModel");
                                            var oData = oModel.getData();
                                            if (oData.Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO) {
                                                var sURL =
                                                        sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_CONFIGURATION_PATH + '?Type=' + oData.Type + '&Name=' + encodeURIComponent(oData.Name) +
                                                                '&Namespace=' + encodeURIComponent(oData.Namespace);
                                                oModel.loadData(sURL, null, false);
                                            }
                                            this.fireRefreshRequested();
                                        }, this ],
                                refreshRequested : [ function(oEvent) {
                                    this.fireRefreshRequested();
                                }, this ]
                            }) ]
                        }).addStyleClass('sapMTile').addStyleClass($(window).height() > 800 ? "sapEtdCustomTileSizeBig" : "sapEtdCustomTileSizeSmall")
                    },
                    editable : false,
                    allowAdd : false
                });
        this._oPage.addContent(this._oTileContainer);
    },
    /**
     * private methods
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.AnomalyPatterns
     */
    _rebuildMLayout : function() {
        this._oPage.destroy();
        this._buildMainUI();
        this.setAggregation("_layout", this._oPage);
    },
    /**
     * private methods
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.AnomalyPatterns
     */
    _editNameAndNamespace : function(callBack) {
        var _that = this;
        var oDialog = new sap.m.Dialog({
            draggable : true,
            title : this.getText("DefineNNS_TXT"),
            contentWidth : "500px",
            contentHeight : "130px",
            buttons : [ new sap.m.Button({
                text : this.getText("OK_TXT"),
                tooltip : this.getText("DefineNNS_TXT"),
                press : function(oEvent) {
                    var oMyModel = _that.getModel("ObjectModel");
                    var sType = oMyModel.getProperty("/Type");
                    var sName = oEvent.getSource().getParent().getParent().getContent()[0].getRows()[0].getCells()[1].getContent()[0].getValue();
                    var sNamespace = oEvent.getSource().getParent().getParent().getContent()[0].getRows()[1].getCells()[1].getContent()[0].getSelectedKey();
                    oMyModel.setProperty("/Name", sName);
                    oMyModel.setProperty("/Namespace", sNamespace);
                    if (sType === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE || sType === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN) {
                        oMyModel.setProperty("/Content/0/Name", sName);
                        oMyModel.setProperty("/Content/0/Namespace", sNamespace);
                    } else if (sType === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO) {
                        var aContent = oMyModel.getProperty("/Content");
                        for (var i = 0; i < aContent.length; i++) {
                            if (!aContent[i].Namespace) {
                                aContent[i].Namespace = sNamespace;
                            }
                        }
                        oMyModel.setProperty("/Content", aContent);
                    }
                    if (callBack) {
                        callBack(true);
                    }
                    oDialog.close();
                }
            }), new sap.m.Button({
                text : this.getText("Cancel_TXT"),
                tooltip : this.getText("Cancel_TXT"),
                press : function(oEvent) {
                    if (callBack) {
                        callBack(false);
                    }
                    oDialog.close();
                }
            }) ]
        });
        oDialog.addContent(this._createNNSLayout());
        oDialog.open();
    },
    _deleteSelectedObject : function(oSelectedObject, Id, oExplorer) {
        this.getParent().getParent();
        this.getView().getController().deleteObject(oSelectedObject, Id, this, oExplorer);
    },

    /**
     * private methods
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.AnomalyPatterns
     */

    _openSelectedObject : function(oSelectedObject) {
        var sURL =
                sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_CONFIGURATION_PATH + '?Type=' + oSelectedObject.Type + '&Name=' + encodeURIComponent(oSelectedObject.Name) + '&Namespace=' +
                        encodeURIComponent(oSelectedObject.Namespace);
        if (oSelectedObject.Id) {
            sURL = sURL + '&Id=' + oSelectedObject.Id;
        }
        var model = this.getModel("ObjectModel");
        var navigationName = "";
        model.attachEventOnce("requestCompleted", function(oEvent) {
            var param = {};
            switch (oSelectedObject.Type) {
            case "Pattern":
                param = {
                    patternId : oSelectedObject.Id
                };
                navigationName = "pattern";
                break;
            case "Scenario":
                param = {
                    name : encodeURIComponent(oSelectedObject.Name),
                    namespace : encodeURIComponent(oSelectedObject.Namespace)
                };
                navigationName = "scenario";
                break;
            case "Feature":
                param = {
                    evaluationId : oSelectedObject.Id
                };
                navigationName = "evaluation";
                break;
            }
            var view = this.getParent().getParent().getParent();
            sap.ui.core.UIComponent.getRouterFor(view).navTo(navigationName, param, false);
        }, this);
        model.loadData(sURL, null, false);
    },
    /**
     * retrieve data
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.AnomalyPatterns
     */
    _createNNSLayout : function() {
        var oModel = this.getModel("ObjectModel");
        var oMain = new sap.ui.commons.layout.MatrixLayout({
            width : "100%",
            height : "100%",
            layoutFixed : true,
            widths : [ "25%", "75%" ],
            columns : 2
        });

        var oLabelName = new sap.m.Label({
            text : this.getCommonText("Name_LBL") + ': '
        });

        var oTFieldName = new sap.m.Input({
            value : {
                path : "/Name",
                formatter : function(sValue) {
                    if (sValue) {
                        return sValue;
                    } else {
                        return "";
                    }
                }
            },
            textAlign : sap.ui.core.TextAlign.Begin,
            width : "300px"
        }).setModel(oModel);

        var oLabelNamespace = new sap.m.Label({
            text : this.getCommonText("Namespace_LBL") + ': '
        });        

        var oNamespaceSelect = new sap.m.Select({
            selectedKey : "{/Namespace}",
            width : "300px",
            items : {
                path : "NamespacesModel>/",
                template : new sap.ui.core.ListItem({
                    key : "{NamespacesModel>NameSpace}",
                    text : "{NamespacesModel>NameSpace}"
                })
            }
        }).setModel(this.getModel("NamespacesModel"), "NamespacesModel")
            .setModel(oModel);

        oMain.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            content : [ oLabelName ],
            hAlign : sap.ui.commons.layout.HAlign.End
        }), new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            content : [ oTFieldName ],
            hAlign : sap.ui.commons.layout.HAlign.Begin
        }));

        oMain.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            content : [ oLabelNamespace ],
            hAlign : sap.ui.commons.layout.HAlign.End
        }), new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            content : [ oNamespaceSelect ],
            hAlign : sap.ui.commons.layout.HAlign.Begin
        }));
        return oMain;
    },

    _isNSOriginal : function(sNamespace) {
        var result = false;
        if (sNamespace) {
            var oNamespaceModel = new sap.ui.model.odata.ODataModel(sap.secmon.ui.m.anomaly.ui.Constants.C_NAMESPACE_ORIGINAL_IN_SYSTEM, {
                json : true,
                defaultCountMode : sap.ui.model.odata.CountMode.Inline
            });
            oNamespaceModel.read("/SystemNamespace", {
                async : false,
                filters : [ new sap.ui.model.Filter({
                    path : "NameSpace",
                    operator : sap.ui.model.FilterOperator.EQ,
                    value1 : sNamespace
                }) ],
                success : function(oData, oResponse) {
                    if (oData.results.length > 0) {
                        result = true;
                    }
                }
            });
        }
        return result;
    },
    checkDataConsistency : function() {
        var data = this.getModel("ObjectModel").getData();
        switch (data.Type) {
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO:
            if(!data.Content.length) {
                // error save without Evaluation
                throw this.getText("EvaluationIsEmpty_MSG");
            }
            for (var i = 0; i < data.Content.length; i++) {
                // check contained evaluation
                if (data.Content[i].Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE) {
                    this._checkFeature(data.Content[i]);
                } else if (data.Content[i].Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN) {
                    this._checkPattern(data.Content[i]);
                }
            }
            break;
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
            this._checkFeature(data.Content[0]);

            break;
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
            this._checkPattern(data.Content[0]);
            break;
        }
    },

    _checkFeature : function(data) {
        // Name+Namespace are set
        if (!data.Name) {
            throw this.getText("TNameNotDefined_MSG", [ this._getUIText(data.Type) ]);
        }
        if (!data.Namespace) {
            throw this.getText("TNSNotDefined_MSG", [ this._getUIText(data.Type) ]);
        }
        // Chart not assigned
        if (!data.FeatureProperties.BaseMeasureId) {
            throw this.getText("TChartNotAss_MSG", [ this._getUIText(data.Type), data.Namespace, data.Name ]);
        }
        // BaselineSampleDuration not defined
        var minTimeRange = 4, maxTimeRange = 100;
        var iBaselineSampleDuration = data.FeatureProperties.BaselineSampleDuration;
        if (!isNaN(parseInt(iBaselineSampleDuration))) {
            if (parseInt(iBaselineSampleDuration) < minTimeRange) {
                throw this.getText("TRNotValid_MSG", [ this._getUIText(data.Type), data.Namespace, data.Name, minTimeRange ]);
            } else if (parseInt(iBaselineSampleDuration) > maxTimeRange) {
                throw this.getText("TRTooBig_MSG", [ this._getUIText(data.Type), data.Namespace, data.Name, maxTimeRange ]);
            }
        } else {
            throw this.getText("TimeRangeNotDef_MSG", [ this._getUIText(data.Type), data.Namespace, data.Name ]);
        }
        var iEstimatedDataAmount = data.FeatureProperties.ChartGroupsAmount * 24 * 7 * iBaselineSampleDuration;
        if (iEstimatedDataAmount > 1 * 1000 * 1000 * 1000) {
            throw this.getText("EstimatedDataAmountMoreThan1B");                   
        }
        else if (iEstimatedDataAmount > 500 * 1000 * 1000) {
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Warning, this.getText("EstimatedDataAmountMoreThan500M"));   
        }
    },

    _checkPattern : function(data) {
        // Name+Namespace are set
        if (!data.Name) {
            throw this.getText("TNameNotDefined_MSG", [ this._getUIText(data.Type) ]);
        }
        if (!data.Namespace) {
            throw this.getText("TNSNotDefined_MSG", [ this._getUIText(data.Type) ]);
        }
        // list of features => at least one evaluation must be
        // assigned
        if (data.PatternProperties.Features.length < 1) {
            throw this.getText("TEvaNotAss_MSG", [ this._getUIText(data.Type), data.Namespace, data.Name ]);
        }

    },
    _getUIText : function(sType) {
        var sName = "";
        switch (sType) {
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO:
            sName = this.getText("Scenario_TXT");
            break;
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
            sName = this.getText("Evaluation_TXT");
            break;
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
            sName = this.getText("Pattern_TXT");
            break;
        }
        return sName;
    }

});