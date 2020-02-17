$.sap.declare("sap.secmon.ui.m.anomaly.ui.FeatureSpace");
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
$.sap.require("sap.secmon.ui.m.anomaly.ui.DiagramCollection");
$.sap.require("sap.secmon.ui.m.anomaly.ui.BrushSlider");
$.sap.require("sap.secmon.ui.commons.NavigationHelper");
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
$.sap.require("sap.ui.commons.layout.MatrixLayout");
$.sap.require("sap.ui.thirdparty.d3");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");

jQuery.sap.require("sap.secmon.ui.m.anomaly.ui.Constants");
/**
 * Data structure: d = [ [], [], ...] [] = [{ axis: "FeatureId_1 (type: string)", value : "FeatureScore 1 (type:double[0.0:1.0])", rawValue:(type: number) , rawValueUnit: (type:string), deviation:
 * "23%", entity: (type:string) }]
 * 
 * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
 */
sap.ui.core.Control.extend("sap.secmon.ui.m.anomaly.ui.FeatureSpace", {

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
            },
        },
        events : {}
    },

    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */

    _aFeatures : [],
    _oVisualization : undefined,
    _oMatrixLayout : undefined,
    _oPage : undefined,
    _oNormalSphere : {},
    _aKBInfo : [],
    _oOutlierTable : undefined,
    _oNavigationHelper : new sap.secmon.ui.commons.NavigationHelper(3600),
    _selectedEntity : undefined,
    _selectedFeatures : undefined,
    _bSelectedPatternChanged : undefined,
    _oSunburstContextMenue : undefined,
    _oContextMenue : undefined,
    _usedHeight : 44 + 40 + 40,
    /**
     * initialize models and controls
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */
    init : function() {
        var _that = this;
        var i18nModel = sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this)).getModel("i18n");
        this.setModel(i18nModel, "i18n");
        // set models
        // UI model
        var oOutlierUIModel = new sap.ui.model.json.JSONModel();
        this.setModel(oOutlierUIModel, "OutlierUIModel");

        // list of available feature spaces in system
        var oFeatureSpaceListModel = new sap.ui.model.json.JSONModel();
        this.setModel(oFeatureSpaceListModel, "FeatureSpaceListModel");

        // oFeatureSpaceListModel
        var oSelectedFeatureSpace = new sap.ui.model.json.JSONModel();
        this.setModel(oSelectedFeatureSpace, "SelectedFeatureSpace");

        // single feature space with available features
        this.setModel(new sap.ui.model.json.JSONModel(), "FeatureSpaceModel");

        // for outlier pattern detection
        this.setModel(new sap.ui.model.json.JSONModel(), "Entities");

        // single feature distribution
        this.setModel(new sap.ui.model.json.JSONModel(), "FeatureDistributionModel");

        // // outliers model
        // this.setModel(new sap.ui.model.json.JSONModel(), "OutlierModel");

        // model for all entities
        this.setModel(new sap.ui.model.json.JSONModel(), "EntitiesModel");

        // data to be shown in table
        var oEntityTableModel = new sap.ui.model.json.JSONModel();
        this.setModel(oEntityTableModel, "EntityTableModel");

        this._buildMainUI();
        $(window).resize(function() {
            _that._rebuildMLayout();
        });

        this.setAggregation("_layout", this._oPage);
    },

    getText : function(sTextKey) {
        var parameters = Array.prototype.slice.call(arguments, 0), model = this.getModel("i18n").getResourceBundle();
        return model.getText.apply(model, parameters);
    },

    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */

    onBeforeRendering : function() {
    },
    /**
     * build link for selected entity
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */
    _rebuildMLayout : function() {
        this._oPage.destroy();
        this._buildMainUI();
        this.setAggregation("_layout", this._oPage);
    },
    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
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
     * build link for selected entity
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */
    _buildFeatureSpaceLink : function() {
        var oFeatureSpaceLink = {};
        var oSelectedFeatureSpace = this.getModel("SelectedFeatureSpace").getData();
        var sFeatureSpaceId = oSelectedFeatureSpace.entity.id;

        var sMonConfigName =
                "/sap/secmon/ui/monitoring/?name=" + oSelectedFeatureSpace.entity.name + "&namespace=" + oSelectedFeatureSpace.entity.nameSpace + "&from=" + oSelectedFeatureSpace.from.toISOString() +
                        "&to=" + oSelectedFeatureSpace.to.toISOString() + sap.secmon.ui.m.commons.NavigationService.getLanguage();

        oFeatureSpaceLink.entity = sFeatureSpaceId;
        oFeatureSpaceLink.monitoring = sMonConfigName;

        return oFeatureSpaceLink;
    },
    /**
     * create content and layout for entity selection
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */
    _createEntitySelection : function() {
        var _that = this;
        var oModelTmp = new sap.ui.model.json.JSONModel();
        var bIsUTC = this.getModel('applicationContext').getData().UTC;
        var oSelectedFeatureSpaceData = this.getModel("SelectedFeatureSpace").getData();
        var sFrom = oSelectedFeatureSpaceData.from;
        var sTo = oSelectedFeatureSpaceData.to;
        var oDateFrom = new Date(sap.secmon.ui.commons.Formatter.dateFormatterEx(bIsUTC, sFrom, 'short', 'short'));
        var sDateFromTime = oDateFrom.getHours();
        var oDateTo = new Date(sap.secmon.ui.commons.Formatter.dateFormatterEx(bIsUTC, sTo, 'short', 'short'));
        var sDateToTime = oDateTo.getHours();

        oModelTmp.setData({
            dateFrom : sap.secmon.ui.m.anomaly.ui.Formatter.DateFormatter.format(oDateFrom),
            dateTo : sap.secmon.ui.m.anomaly.ui.Formatter.DateFormatter.format(oDateTo),
            timeFrom : sDateFromTime,
            timeTo : sDateToTime
        });

        var oFeatureSpaceListModel = this.getModel("FeatureSpaceListModel");
        var sSelectedEntity = oSelectedFeatureSpaceData.entity.id;
        // List of available feature spaces
        oFeatureSpaceListModel.loadData(sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_PATTERN_LIST + "/AnomalyPattern", null, false);

        var oMain = new sap.ui.layout.form.SimpleForm({
            editable : true,
            layout : sap.ui.layout.form.SimpleFormLayout.ResponsiveGridLayout,
            content : [ new sap.m.Label({
                text : this.getText("Pattern_TXT")
            }), new sap.m.ComboBox("entitySelected", {
                selectedKey : sSelectedEntity,
                items : {
                    path : "/d/results",
                    template : new sap.ui.core.ListItem({
                        key : "{Id}",
                        text : "{Name}",
                        additionalText : "{Namespace}"
                    })
                }
            }).setModel(_that.getModel("FeatureSpaceListModel")), new sap.m.Label({
                text : this.getText("BU_FLOD_LBL_Time1HFrom") + (bIsUTC === true ? ' (UTC)' : '')
            }), new sap.m.DatePicker("datePickerFrom", {
                value : {
                    path : "/dateFrom",
                    formatter : function(oValue) {
                        if (oValue) {
                            return oValue;
                        } else {
                            return "";
                        }
                    }
                },
                change : function(oEvent) {
                    if (!oEvent.getParameter("invalidValue")) {
                        sap.ui.getCore().byId(oEvent.getParameters().id).setValueState(sap.ui.core.ValueState.None);
                    } else {
                        sap.ui.getCore().byId(oEvent.getParameters().id).setValueState(sap.ui.core.ValueState.Error);
                    }
                }
            }).setModel(oModelTmp), new sap.m.ComboBox("timeFrom", {
                selectedKey : {
                    path : "/timeFrom",
                    formatter : function(oValue) {
                        return oValue;
                    }
                },
                items : [ new sap.ui.core.ListItem({
                    text : "0:00",
                    key : "0"
                }), new sap.ui.core.ListItem({
                    text : "1:00",
                    key : "1"
                }), new sap.ui.core.ListItem({
                    text : "2:00",
                    key : "2"
                }), new sap.ui.core.ListItem({
                    text : "3:00",
                    key : "3"
                }), new sap.ui.core.ListItem({
                    text : "4:00",
                    key : "4"
                }), new sap.ui.core.ListItem({
                    text : "5:00",
                    key : "5"
                }), new sap.ui.core.ListItem({
                    text : "6:00",
                    key : "6"
                }), new sap.ui.core.ListItem({
                    text : "7:00",
                    key : "7"
                }), new sap.ui.core.ListItem({
                    text : "8:00",
                    key : "8"
                }), new sap.ui.core.ListItem({
                    text : "9:00",
                    key : "9"
                }), new sap.ui.core.ListItem({
                    text : "10:00",
                    key : "10"
                }), new sap.ui.core.ListItem({
                    text : "11:00",
                    key : "11"
                }), new sap.ui.core.ListItem({
                    text : "12:00",
                    key : "12"
                }), new sap.ui.core.ListItem({
                    text : "13:00",
                    key : "13"
                }), new sap.ui.core.ListItem({
                    text : "14:00",
                    key : "14"
                }), new sap.ui.core.ListItem({
                    text : "15:00",
                    key : "15"
                }), new sap.ui.core.ListItem({
                    text : "16:00",
                    key : "16"
                }), new sap.ui.core.ListItem({
                    text : "17:00",
                    key : "17"
                }), new sap.ui.core.ListItem({
                    text : "18:00",
                    key : "18"
                }), new sap.ui.core.ListItem({
                    text : "19:00",
                    key : "19"
                }), new sap.ui.core.ListItem({
                    text : "20:00",
                    key : "20"
                }), new sap.ui.core.ListItem({
                    text : "21:00",
                    key : "21"
                }), new sap.ui.core.ListItem({
                    text : "22:00",
                    key : "22"
                }), new sap.ui.core.ListItem({
                    text : "23:00",
                    key : "23"
                }) ]
            }).setModel(oModelTmp) ]
        });
        return oMain;
    },

    /**
     * create content and layout for pattern simulation
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */
    _createPatternSimulation : function() {
        var _that = this;
        var oMain = new sap.ui.layout.form.SimpleForm({
            editable : true,
            layout : sap.ui.layout.form.SimpleFormLayout.ResponsiveGridLayout,
            content : [ new sap.m.Label({
                text : this.getText("ChangeOutputMode_LBL"),
            }), new sap.m.ComboBox({
                selectedKey : {
                    path : "/Pattern/func",
                    formatter : function(sValue) {
                        return sValue;
                    }
                },
                items : [ new sap.ui.core.ListItem({
                    text : this.getText("AllEvaluationInPattern_TXT"),
                    key : sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.MIN
                }), new sap.ui.core.ListItem({
                    text : this.getText("OneEvaluationInPattern_TXT"),
                    key : sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.MAX
                }), new sap.ui.core.ListItem({
                    text : this.getText("AvgEvaluationInPattern_TXT"),
                    key : sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.AVG
                }) ]
            }).setModel(_that.getModel("FeatureSpaceModel")), new sap.m.Label({
                text : this.getText("ShowAllEntities_LBL"),
            }), new sap.m.CheckBox({
                selected : {
                    path : "/Pattern/outliersOnly",
                    formatter : function(sValue) {
                        if (sValue === false) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            }).setModel(_that.getModel("FeatureSpaceModel")) ]
        });
        return oMain;
    },
    _createToolBar : function() {
        // add help link
        var oHelp = new sap.ui.core.Icon({
            src : "sap-icon://sys-help-2",
            size : "1.7em",
            width : "1.7em",
            color : "grey",
            hoverColor : "black",
            hoverBackgroundColor : "#009de0",
            press : [ function(oEvent) {
                window.open("/sap/secmon/help/76ce18b96d884caa9b2c509906bb8bb6.html");
            }, this ]
        });
        var iconChangePattern = new sap.ui.core.Icon({
            src : "sap-icon://action-settings",
            size : "1.7em",
            width : "1.7em",
            color : "darkgray",
            hoverColor : "black",
            hoverBackgroundColor : "#009de0",
            press : [ function(oEvent) {

            }, this ]
        });

        // var iconSelectEntity = new sap.ui.core.Icon("icon:Select", {
        // src : "sap-icon://action-settings",
        // size : "1.7em",
        // width : "1.7em",
        // color : "darkgray",
        // hoverColor : "black",
        // hoverBackgroundColor : "#009de0",
        // press : [ function(oEvent) {
        // this._oEntitySelectionPopUp.destroyContent();
        // this._oEntitySelectionPopUp.addContent(this._createEntitySelection());
        // this._oEntitySelectionPopUp.open();
        // }, this ]
        // });
        // iconSelectEntity.setTooltip(this.getText("BU_FLOD_TXT_EntityTime"));

        // var iconOpenWorkspace = new sap.ui.core.Icon("icon:Workspace", {
        // src : "sap-icon://multiple-line-chart",
        // size : "1.7em",
        // width : "1.7em",
        // color : "#009de0",
        // hoverColor : "black",
        // hoverBackgroundColor : "#009de0",
        // press : [ function(oEvent) {
        // _that._oNavigationHelper.navigate({
        // newWindow : true,
        // url : "/sap/secmon/ui/anomaly/",
        // data :
        // _that._getData4WSNavigation(_that.getModel("SelectedFeatureSpace").getData().workspace)
        // }, function() {
        // }, function() {
        // }, true);
        // }, this ]
        // });
        // iconOpenWorkspace.setTooltip(this.getText("BU_FLOD_TOL_AnalyzeFL"));

        // var iconOpenMonitoring = new sap.ui.core.Icon("icon:Monitor", {
        // src : "sap-icon://sys-monitor",
        // size : "1.7em",
        // width : "1.7em",
        // color : "darkgray",
        // hoverColor : "black",
        // hoverBackgroundColor : "#009de0",
        // press : [ function(oEvent) {
        // window.open(this._buildFeatureSpaceLink().monitoring);
        // }, this ]
        // });
        // iconOpenMonitoring.setTooltip(this.getText("BU_FLOD_TOL_OpenMon"));

        // add all buttons to toolbar
        var oHLayoutToolBar = new sap.ui.commons.layout.HorizontalLayout();
        oHLayoutToolBar.addContent(oHelp);
        oHLayoutToolBar.addContent(iconChangePattern);
        // oHLayoutToolBar.addContent(iconOpenWorkspace);
        // oHLayoutToolBar.addContent(iconOpenMonitoring);

        return oHLayoutToolBar;
    },

    /**
     * retrieve data
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */
    initialize : function(PatternId, TimeFrom, TimeTo) {
        var oEntity = {}, oPatternData;
        var oSelectedPattern = this.getModel("SelectedFeatureSpace");
        var oModel = this.getModel("FeatureSpaceListModel");
        if (PatternId) {
            oModel.loadData(sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_PATTERN_LIST + "/AnomalyPattern(X'" + PatternId + "')", null, false);
            oPatternData = oModel.getData();
            oEntity.id = oPatternData.d.Id;
            oEntity.name = oPatternData.d.Name;
            oEntity.nameSpace = oPatternData.d.Namespace;

        } else {
            oModel.loadData(sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_PATTERN_LIST + '/AnomalyPattern?$top=1', null, false);
            oPatternData = oModel.getData();
            oEntity.id = oPatternData.d.results[0].Id;
            oEntity.name = oPatternData.d.results[0].Name;
            oEntity.nameSpace = oPatternData.d.results[0].Namespace;
        }

        if ($.isEmptyObject(oPatternData)) {
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, this.getText("Error_TIT"), this.getText("PatternNotFound_MSG"));
            return;
        }

        var sDateTimeFrom, sDateTimeTo;
        if (TimeFrom && TimeTo) {
            sDateTimeFrom = TimeFrom;
            sDateTimeTo = TimeTo;
        } else {
            var oDateTimeTo = new Date();
            var iTo = oDateTimeTo.getHours();
            oDateTimeTo = new Date(oDateTimeTo.setHours(iTo, 0, 0, 0));
            var oDateTimeFrom = new Date(oDateTimeTo.getTime() - 3600 * 1000 * 1);
            sDateTimeTo = new sap.secmon.ui.commons.CommonFunctions().formatDateTime(oDateTimeTo);
            sDateTimeFrom = new sap.secmon.ui.commons.CommonFunctions().formatDateTime(oDateTimeFrom);
        }

        // set new selected Data
        oSelectedPattern.setData({
            entity : oEntity,
            entityValue : [],
            from : sDateTimeFrom,
            to : sDateTimeTo
        });
        this._readData();
    },
    /**
     * retrieve data
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */
    _readData : function(oData) {

        var _that = this;
        var oPayload, oSelectedData;
        if (oData) {
            oSelectedData = oData;
        } else {
            oSelectedData = _that.getModel("SelectedFeatureSpace").getData();
        }
        this._oPage.setBusy(true);
        // input parameter for backend call
        // set navigation info
        var sPatternId = new sap.secmon.ui.commons.CommonFunctions().base64ToHex(oSelectedData.entity.id);
        oPayload = {
            "patternId" : sPatternId,
            "fromTimestamp" : oSelectedData.from,
            "toTimestamp" : oSelectedData.to
        };

        new sap.secmon.ui.commons.AjaxUtil().postJson(sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_PATTERN_DATA, JSON.stringify(oPayload)).done(function(response, textStatus, XMLHttpRequest) {
            var oFeatureSpaceModel = _that.getModel("FeatureSpaceModel");
            response.Pattern.outliersOnly = oFeatureSpaceModel.getProperty("/Pattern/outliersOnly");
            oFeatureSpaceModel.setData(response);
            _that._setVisualizationData(oFeatureSpaceModel);
            _that._oPage.setBusy(false);
            _that.getModel("SelectedFeatureSpace").setData(oSelectedData);
            _that._bSelectedPatternChanged = false;
            // set diagram options, which depends on number of evaluations of
            // selected pattern
            var oFeatureSpaceData = oFeatureSpaceModel.getData();
            var oUIModel = _that.getModel("OutlierUIModel");
            var iFLength = 0;
            if (oFeatureSpaceModel.getData().Features) {
                iFLength = oFeatureSpaceData.Features.length;
            }
            oUIModel.setProperty("/multiDimensional", iFLength > 2 ? true : false);
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, _that.getText("PatternCalcSucces"));
            //          
            // if (oFeatureSpaceData.Points.length > 0 &&
            // oFeatureSpaceData.Points[0].entity) {
            // new
            // sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success,
            // _that.getText("PatternCalcSucces"));
            // } else {
            // new
            // sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success,
            // _that.getText("PatternCalcNoData"));
            // }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var oFeatureSpaceModel = _that.getModel("FeatureSpaceModel");
            oFeatureSpaceModel.setData({});
            oFeatureSpaceModel.refresh(true);
            _that._oPage.setBusy(false);
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, _that.getText("Error_TIT"), jqXHR.responseText);
        });
    },

    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */
    _setVisualizationData : function(oFeatureSpaceModel) {
        var _that = this;
        // features
        this._aFeatures = oFeatureSpaceModel.getProperty("/Features");
        this._aKBInfo = oFeatureSpaceModel.getProperty("/Entity");
        var distances = {};
        var sFunc = oFeatureSpaceModel.getProperty("/Pattern/func");

        var iRadiusSquare = 0.0;
        var aRadius = [], iAvg = 0.00;
        $.each(this._aFeatures, function(idx, aFeature) {
            aRadius.push(aFeature.standardDeviation);
            iAvg += aFeature.standardDeviation;
            iRadiusSquare += Math.pow(aFeature.standardDeviation, 2);

        });
        distances.radius = aRadius;
        distances.euklid = Math.sqrt(iRadiusSquare) / Math.sqrt(this._aFeatures.length);
        distances.avg = iAvg / this._aFeatures.length;

        this._oNormalSphere.distances = distances;
        this._oNormalSphere.analyzedArea = [ 0, 0 ]; // default

        // Distribution modelspider
        var aAllEntities = [];
        $.each(oFeatureSpaceModel.getProperty("/Points"), function(idx, oPoint) {
            // collect outliers
            var sfeaturesScore = "", distances = {}, iRadiusSquare = 0.0, iAvg = 0.0, iMin = 0.0, iMax = 0.0;
            $.each(oPoint.scores, function(idx, oScore) {
                // FeatureScores for Table in UI
                if (sfeaturesScore === "") {
                    sfeaturesScore = _that._aFeatures[idx].name + ": " + oScore.toFixed(2);
                } else {
                    sfeaturesScore = sfeaturesScore + "\n " + _that._aFeatures[idx].name + ": " + oScore.toFixed(2);
                }
                iRadiusSquare += Math.pow(oScore, 2);
                iAvg += oScore;
                if (idx === 0) {
                    iMin = oScore;
                }
                iMin = iMin < oScore ? iMin : oScore;
                iMax = iMax > oScore ? iMax : oScore;
            });

            distances.euklid = Math.sqrt(iRadiusSquare);
            distances.avg = iAvg / _that._aFeatures.length;
            distances.min = iMin;
            distances.max = iMax;
            aAllEntities.push({
                entity : oPoint.entityValue,
                entityValue : _that._aKBInfo,
                scores : oPoint.scores,
                rawQuery : oPoint.rawQuery,
                rawRef : oPoint.rawRef,
                distances : distances,
                sD : oPoint.sD,
                featuresScore : sfeaturesScore,
                isOutlier : _that._isOutlier(distances, _that._oNormalSphere, sFunc),
                isSelected : false
            });
        });

        // sort aAllEntities depending of selected pattern func
        switch (sFunc) {
        case sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.MAX:
            aAllEntities.sort(function(a, b) {
                return b.distances.max - a.distances.max;
            });
            break;
        case sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.MIN:
            aAllEntities.sort(function(a, b) {
                return b.distances.min - a.distances.min;
            });
            break;
        case sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.MAX:
            aAllEntities.sort(function(a, b) {
                return b.distances.avg - a.distances.avg;
            });
            break;
        }

        // entities model
        this.getModel("Entities").setData({
            points : aAllEntities,
            features : this._aFeatures,
            normalSphere : this._oNormalSphere,
        });
    },
    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */
    _isOutlier : function(oDistance, oNormalSphere, func) {
        var isOutlier = false;
        switch (func) {
        case sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.MAX:
            if (oDistance.max >= 0.63) {
                isOutlier = true;
            }
            break;
        case sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.MIN:
            if (oDistance.min >= 0.63) {
                isOutlier = true;
            }
            break;
        case sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.AVG:
            if (oDistance.avg >= 0.63) {
                isOutlier = true;
            }
            break;
        }
        return isOutlier;
    },

    /**
     * update entity detail layout with new selectin entity
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */
    _createEntityDetails : function(oEntity, oKBInfo, oNormalSphere) {
        var _that = this;
        if (!oEntity) {
            return;
        }
        var sDisplayName, sKbName;
        for (var i = 0; i < oKBInfo.length; i++) {
            if (sDisplayName) {
                sDisplayName = sDisplayName + " | " + oEntity.entity[i + 1];
            } else {
                sDisplayName = oEntity.entity[i + 1];
            }
            if (sKbName) {
                sKbName = sKbName + " | " + oKBInfo[i].displayName;
            } else {
                sKbName = oKBInfo[i].displayName;
            }
        }
        sDisplayName = sKbName + ': ' + sDisplayName;

        // create values for table
        var oModelTmp = new sap.ui.model.json.JSONModel();
        var aFValues = [];
        $.each(this._aFeatures, function(idx, oFeature) {
            var oQuery;
            if (oEntity.rawRef[idx] !== 0) {
                oQuery = ((oEntity.rawQuery[idx] - oEntity.rawRef[idx]) / oEntity.rawRef[idx] * 100);
                if (oQuery > 0) {
                    oQuery = oEntity.rawQuery[idx] + " (" + "+" + oQuery.toFixed(2) + "%" + ")";
                } else {
                    oQuery = oEntity.rawQuery[idx] + " (" + oQuery.toFixed(2) + "%" + ")";
                }
            } else {
                oQuery = oEntity.rawQuery[idx] + " (n/a %)";
            }
            aFValues.push({
                Name : oFeature.name,
                RawQuery : (oFeature.aggregationMethod === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.RVM) ? _that.getText("BU_FLOD_TXT_NotA") : oQuery,
                RawRef : (oFeature.aggregationMethod === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.RVM) ? _that.getText("BU_FLOD_TXT_NotA") : oEntity.rawRef[idx].toFixed(0),
                sD : (oFeature.aggregationMethod === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.RVM) ? _that.getText("BU_FLOD_TXT_NotA") : oEntity.sD[idx].toFixed(0),
                Score : (oEntity.scores[idx] * 100).toFixed(0)
            });
        });
        oModelTmp.setData(aFValues);
        var oTable = new sap.ui.table.Table({
            width : "100%",
            selectionMode : sap.ui.table.SelectionMode.None,
            visibleRowCount : this._aFeatures.length,
            columns : [ new sap.ui.table.Column({
                width : "40%",
                label : new sap.ui.commons.TextView({
                    text : this.getText("BU_FLOD_LBL_Evaluation"),
                    tooltip : this.getText("BU_FLOD_LBL_Evaluation")
                }),
                template : new sap.m.Label({
                    text : "{Name}"
                }),

            }), new sap.ui.table.Column({
                width : "15%",
                label : new sap.ui.commons.TextView({
                    text : this.getText("BU_FLOD_LBL_RawValue"),
                    tooltip : this.getText("BU_FLOD_LBL_RawValue")
                }),
                template : new sap.ui.commons.TextView({
                    text : "{RawQuery}"
                })
            }), new sap.ui.table.Column({
                width : "15%",
                label : new sap.ui.commons.TextView({
                    text : this.getText("BU_FLOD_LBL_RawValueRef"),
                    tooltip : this.getText("BU_FLOD_LBL_RawValueRef")
                }),
                template : new sap.ui.commons.TextView({
                    text : "{RawRef}"
                })
            }), new sap.ui.table.Column({
                width : "15%",
                label : new sap.ui.commons.TextView({
                    text : this.getText("BU_FLOD_TXT_SD"),
                    tooltip : this.getText("BU_FLOD_TXT_SD")
                }),
                template : new sap.ui.commons.TextView({
                    text : "{sD}"
                })
            }), new sap.ui.table.Column({
                width : "15%",
                label : new sap.ui.commons.TextView({
                    text : this.getText("BU_FLOD_LBL_Score"),
                    tooltip : this.getText("BU_FLOD_LBL_Score")
                }),
                template : new sap.ui.commons.TextView({
                    text : "{Score}"
                })
            }) ]
        });
        oTable.setModel(oModelTmp);
        oTable.bindRows("/");

        var oEntityDetails = new sap.ui.commons.layout.MatrixLayout({
            width : "100%",
            height : "100%",
            layoutFixed : true,
            widths : [ "50%", "50%" ],
            columns : 2
        });

        oEntityDetails.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "35px",
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                vAlign : sap.ui.commons.layout.VAlign.Top,
                hAlign : sap.ui.commons.layout.HAlign.Center,
                colSpan : 2,
                content : [ new sap.ui.commons.TextView({
                    text : sDisplayName
                }).addStyleClass("sapEtdSubSubTitle") ]
            }) ]
        }));

        oEntityDetails.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "100%",
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                vAlign : sap.ui.commons.layout.VAlign.Top,
                colSpan : 2,
                content : [ oTable ]
            }) ]
        }));

        return oEntityDetails;
    },

    /**
     * update all models for display
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */
    _prepareData : function(iFromInPercent, iToInPercent, aSelectedData) {

        var _that = this;
        var aEntities4Table = [];
        var aAllPoints = [];

        _that._oNormalSphere.analyzedArea = [ iFromInPercent, iToInPercent ];
        var oFeatureSpaceModel = _that.getModel("FeatureSpaceModel");
        $.each(oFeatureSpaceModel.getProperty("/Points"), function(idx, oPoint) {
            aAllPoints.push({
                name : oPoint.name,
                scores : oPoint.scores
            });
        });

        _that.getModel("FeatureDistributionModel").setData({
            points : aAllPoints,
            normalSphere : _that._oNormalSphere,
            axes : _that._aFeatures
        });

        var oEntities = _that.getModel("Entities");
        var oEntitiesPoints = oEntities.getData().points;
        $.each(oEntitiesPoints, function(idx, oPoint) {
            oPoint.isSelected = false;
            if (oPoint.entity) {
                $.each(aSelectedData, function(idx, oSelectedPoint) {
                    if (oSelectedPoint.entity[0] === oPoint.entity[0]) {
                        oPoint.isSelected = true;
                    }
                });
            }

        });
        // collect data for table
        $.each(aSelectedData, function(idx, oSelectedPoint) {
            aEntities4Table.push({
                entity : oSelectedPoint.entity,
                rawQuery : oSelectedPoint.rawQuery,
                rawRef : oSelectedPoint.rawRef,
                sD : oSelectedPoint.sD,
                distances : oSelectedPoint.distances,
                scores : oSelectedPoint.scores,
                featuresScore : oSelectedPoint.featuresScore
            });
        });
        var oEntityTableModel = this.getModel("EntityTableModel");
        oEntityTableModel.setData(aEntities4Table);

        // Model for Spider + Outlier Pattern Detection
        var oEntitiesModel = _that.getModel("EntitiesModel");
        oEntitiesModel.setData({});

        // required to provoke OnAfterendering
        oEntitiesModel.setData({
            points : oEntitiesPoints,
            features : _that._aFeatures,
            normalSphere : _that._oNormalSphere,
        });

    },
    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */
    _getData4WSNavigation : function() {
        //
        // var oWSData = this.getModel("defaultWorkspace").getData();
        // var oSelectedFeatureSpace =
        // _that.getModel("SelectedFeatureSpace").getData();
        // var oResult = {};
        // var oFilterInitial = {
        // "valueRange" : {
        // "operator" : "=",
        // "searchTerms" : [],
        // "searchTermRefKeys" : []
        // },
        // "workspaceContext" : "Path1.Subset",
        // "luid" : 1,
        // "context" : "Log",
        // "key" : "",
        // "displayName" : "",
        // "description" : "",
        // "dataType" : "ValueVarChar",
        // "filterOperators" : [ "=", "LIKE", "IN", "IN VALUE LIST" ],
        // "isFieldRef" : 0,
        // "count" : "-1",
        // "isEnumeration" : false
        // };
        //
        // if (oWSData) {
        // // change period
        // oWSData.period.operator = "BETWEEN";
        // oWSData.period.searchTerms = [];
        // oWSData.period.searchTerms.push(oSelectedFeatureSpace.from.toISOString());
        // oWSData.period.searchTerms.push(oSelectedFeatureSpace.to.toISOString());
        // // set fullscreen for bubble chart
        // oWSData.fullScreen = true;
        // oWSData.browsingView = "BubbleChart";
        // // add additional filters containing outliers
        // var aSelectedEntities = this.getModel("EntityTableModel").getData();
        // var aFilters = [];
        // var oFilter = {};
        // var oKB = this.getModel("FeatureSpaceModel").getData().Entity;
        //
        // $.each(aSelectedEntities, function(i, oEntity) {
        // for (var j = 1; j < oEntity.entity.length; j++) {
        // var elementPos1 = aFilters.map(function(x) {
        // return x.key;
        // }).indexOf(oKB[j - 1].key);
        // var oFilter = aFilters[elementPos1];
        // if (!oFilter) {
        // oFilter = $.extend(true, {}, oFilterInitial);
        // oFilter.key = oKB[j - 1].key;
        // oFilter.description = oKB[j - 1].displayName;
        // oFilter.displayName = oKB[j - 1].displayName;
        // oFilter.valueRange.exclude = false;
        // oFilter.valueRange.operator = "IN";
        // oFilter.valueRange.searchTerms = [];
        // aFilters.push(oFilter);
        // }
        //
        // var elementPos2 = oFilter.valueRange.searchTerms.map(function(x) {
        // return x;
        // }).indexOf(oEntity.entity[j]);
        // var oSearchTerm = aFilters[elementPos2];
        // if (!oSearchTerm) {
        // oFilter.valueRange.searchTerms.push(oEntity.entity[j])
        // }
        // }
        // });
        //
        // // enhance path with filters
        // $.each(oWSData.paths, function(k, oPath) {
        // $.each(aFilters, function(l, oF) {
        // var oFCopy = $.extend(true, {}, oF);
        // var res = oFCopy.workspaceContext.split('.');
        // oFCopy.workspaceContext = res[0] + '.Subset' + (oPath.filters.length
        // + 1);
        // oFCopy.luid = oPath.filters.length + 1;
        // oPath.filters.push(oFCopy);
        // });
        //
        // });
        //
        // }
        // oResult.data = oWSData;
        // oResult.operation = 'OUTLIER';
        // return oResult;
    },
    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */
    _createOutlierTable : function() {
        var _that = this;
        var iVisRowCount = Math.floor((($(window).height() - this._usedHeight) * 0.67 - 37) / 25);
        this._oOutlierTable =
                new sap.ui.table.Table({
                    width : "100%",
                    columnHeaderHeight : 20,
                    rowHeight : 25,
                    visibleRowCount : iVisRowCount,
                    selectionMode : sap.ui.table.SelectionMode.Single,
                    rowSelectionChange : [ function(oEvent) {
                        var oEntity;
                        if (oEvent.getSource().getSelectedIndex() > -1) {
                            oEntity = oEvent.getSource().getContextByIndex(oEvent.getSource().getSelectedIndex()).getObject("").entity;
                        }
                        this._oVisualization.hightlightSelectedEntity(oEntity);
                    }, this ],
                    columns : [
                            new sap.ui.table.Column({
                                width : "50%",
                                label : new sap.m.Label({
                                    text : {
                                        path : "FeatureSpaceModel>/Entity",
                                        formatter : function(val) {
                                            var sEntityValue;
                                            if (val && val.length > 0) {
                                                for (var i = 0; i < val.length; i++) {
                                                    if (sEntityValue) {
                                                        sEntityValue = sEntityValue + " | " + val[i].displayName;
                                                    } else {
                                                        sEntityValue = val[i].displayName;
                                                    }
                                                }
                                            } else {
                                                sEntityValue = _that.getText("BU_FLOD_LBL_Entity_Value");
                                            }
                                            return sEntityValue;
                                        }
                                    },
                                    tooltip : {
                                        path : "FeatureSpaceModel>/Entity",
                                        formatter : function(val) {
                                            var sEntityValue;
                                            if (val && val.length > 0) {
                                                for (var i = 0; i < val.length; i++) {
                                                    if (sEntityValue) {
                                                        sEntityValue = sEntityValue + " | " + val[i].displayName;
                                                    } else {
                                                        sEntityValue = val[i].displayName;
                                                    }
                                                }
                                            } else {
                                                sEntityValue = _that.getText("BU_FLOD_LBL_Entity_Value");
                                            }
                                            return sEntityValue;
                                        }
                                    }
                                }),
                                template : new sap.ui.commons.Link({
                                    text : {
                                        path : "EntityTableModel>entity",
                                        formatter : function(entity) {
                                            if (entity) {
                                                var sEntity = "";
                                                for (var i = 1, len = entity.length; i < len; i++) {
                                                    if (sEntity === "") {
                                                        sEntity = entity[i];
                                                    } else {
                                                        sEntity = sEntity + " | " + entity[i];
                                                    }
                                                }
                                                return sEntity;
                                            }
                                        }
                                    },
                                    press : [
                                            function(oEvent) {
                                                // Pop-up for entity details
                                                var oEntityDetailsPopUp = new sap.m.Dialog({
                                                    draggable : true,
                                                    title : _that.getText("BU_FLOD_TIT_ESDetails"),
                                                    contentWidth : "1000px",
                                                    contentHeight : "500px",
                                                    buttons : [ new sap.m.Button({
                                                        text : _that.getText("BU_FLOD_LBL_Close"),
                                                        tooltip : _that.getText("BU_FLOD_LBL_Close"),
                                                        press : function(oEvent) {
                                                            oEntityDetailsPopUp.destroy();
                                                        }
                                                    }) ]
                                                });
                                                oEntityDetailsPopUp.addContent(this._createEntityDetails(this.getModel("EntityTableModel").getProperty(
                                                        this._oOutlierTable.getContextByIndex(oEvent.getSource().getParent().getIndex()).getPath()), this._aKBInfo, this._oNormalSphere));
                                                oEntityDetailsPopUp.open();
                                            }, this ]
                                }),

                            }), new sap.ui.table.Column({
                                width : "50%",
                                label : new sap.m.Label({
                                    text : this.getText("BU_FLOD_LBL_Norm_TScore")
                                }),
                                template : new sap.ui.commons.TextView({
                                    text : {
                                        parts : [ {
                                            path : "EntityTableModel>distances"
                                        }, {
                                            path : "FeatureSpaceModel>/Pattern/func",
                                        } ],

                                        formatter : function(distance, func) {
                                            if (distance && func) {
                                                var totalScore;
                                                switch (func) {
                                                case sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.MAX:
                                                    totalScore = distance.max;
                                                    break;
                                                case sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.MIN:
                                                    totalScore = distance.min;
                                                    break;
                                                case sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.AVG:
                                                    totalScore = distance.avg;
                                                    break;
                                                }
                                                return (totalScore * 100).toFixed(0);
                                            }
                                        }
                                    }
                                }),
                                sortProperty : "distances/euklid",
                                filterProperty : "distances/euklid"
                            }) ]
                });
        this._oOutlierTable.bindRows("EntityTableModel>/");

        var oLayout = new sap.ui.layout.VerticalLayout({
            content : [ new sap.m.Label({
                text : ""
            }), new sap.m.Label({
                text : {
                    path : "EntitiesModel>/points",
                    formatter : function(points) {
                        var totalScore = 0;
                        if (points) {
                            $.each(points, function(idx, oPoint) {
                                if (oPoint.isSelected) {
                                    totalScore++;
                                }
                            });
                        }
                        return _that.getText("BU_FLOD_LBL_Selected") + ": " + totalScore;
                    }
                }
            }), this._oOutlierTable ]
        });

        return oLayout;
    },
    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */
    _createSlider : function() {
        var _that = this;
        var oLayout = new sap.ui.commons.layout.MatrixLayout({
            width : "100%",
            layoutFixed : true,
            widths : [ "50%", "50%" ],
            columns : 2
        });

        oLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                content : [ new sap.m.Label({
                    text : this.getText("BU_FLOD_LBL_SSelector") + ": "
                }).addStyleClass("sapEtdADPadding"), new sap.m.CheckBox({
                    text : this.getText("ShowAllEntities_LBL"),
                    textAlign : sap.ui.core.TextAlign.Left,
                    selected : {
                        path : "FeatureSpaceModel>/Pattern/outliersOnly",
                        formatter : function(sValue) {
                            if (sValue === false) {
                                return true;
                            } else {
                                return false;
                            }
                        }
                    },
                    select : function(oEvent) {
                        var oFeatureSpaceModel = _that.getModel("FeatureSpaceModel");
                        oFeatureSpaceModel.setProperty("/Pattern/outliersOnly", (!oEvent.getParameter("selected")));
                    }
                }) ]
            }) ]
        }));
        oLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "100%",
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                vAlign : sap.ui.commons.layout.VAlign.Top,
                hAlign : sap.ui.commons.layout.HAlign.Center,
                content : [ new sap.secmon.ui.m.anomaly.ui.BrushSlider({
                    width : $(window).width() + "px",
                    height : ($(window).height() - this._usedHeight) * 0.33 - 37 - 24 + "px",
                    data : "{Entities>/}",
                    func : "{FeatureSpaceModel>/Pattern/func}",
                    outliersOnly : "{FeatureSpaceModel>/Pattern/outliersOnly}",
                    slide : [ function(oEvent) {
                        this._prepareData(oEvent.getParameters().selectedArea[0], oEvent.getParameters().selectedArea[1], oEvent.getParameters().selectedData);
                    }, this ]
                }) ]
            }) ]
        }));
        return oLayout;
    },

    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureSpace
     */
    _createSpider : function() {
        this._oVisualization = new sap.secmon.ui.m.anomaly.ui.DiagramCollection({
            width : $(window).width() * 0.67 + 'px',
            height : ($(window).height() - this._usedHeight) * 0.7 - 37 + "px",
            data : "{EntitiesModel>/}",
            showContextMenue : [ function(oEvent) {
                var _that = this;
                var sEntity;
                _that._selectedEntity = oEvent.getParameters().entity;
                _that._selectedFeatures = oEvent.getParameters().features;
                for (var i = 1; i < _that._selectedEntity.entity.length; i++) {
                    if (sEntity) {
                        sEntity = sEntity + " | " + _that._selectedEntity.entity[i];
                    } else {
                        sEntity = _that._selectedEntity.entity[i];
                    }
                }
                var sText = _that.getText("BU_FLOD_SHOWDETAILS", sEntity);
                var oOutlierUIModel = _that.getModel("OutlierUIModel");
                oOutlierUIModel.setProperty("/showDetails", sText);
                var oInlineController = {
                    handleShowDetails : function() {
                        // call sunburst
                        _that._handleShowDetails(_that._selectedEntity, _that._selectedFeatures);
                    }
                };
                if (!this._oContextMenue) {
                    this._oContextMenue = sap.ui.xmlfragment("_contextMenue", "sap.secmon.ui.m.anomaly.ui.ShowDetailsContextMenue", oInlineController);
                    this._oContextMenue.setModel(oOutlierUIModel);
                }

                var selectedEntity = oEvent.getParameter("entity");
                jQuery.sap.syncStyleClass("sapUiSizeCompact", selectedEntity, this._oContextMenue);
                this._oContextMenue.openBy(selectedEntity.target);

            }, this ],
            showContextMenueDetails : [ function(oEvent) {
                var _that = this;
                var sEntity;
                _that._selectedEntityValue = oEvent.getParameters().entity;
                for (var i = 1; i < _that._selectedEntity.entity.length; i++) {
                    if (sEntity) {
                        sEntity = sEntity + " | " + _that._selectedEntity.entity[i];
                    } else {
                        sEntity = _that._selectedEntity.entity[i];
                    }
                }
                var sText = _that.getText("BU_FLOD_NAV2WSFILTER", sEntity);
                var oOutlierUIModel = _that.getModel("OutlierUIModel");
                oOutlierUIModel.setProperty("/navigate2WS", sText);
                oOutlierUIModel.setProperty("/back2Diagram", _that.getText("BU_FLOD_BACK_DIAGRAM"));
                var oInlineController = {
                    handleNavigateToWorkspace : function() {
                        // load workspace json
                        var oWSModel = _that.getModel("defaultWorkspace");
                        var oWSData = $.extend(true, {}, oWSModel.getData());
                        // change period
                        var oSelectedFeatureSpaceData = _that.getModel("SelectedFeatureSpace").getData();
                        oWSData.period.operator = "BETWEEN";
                        oWSData.period.searchTerms = [];
                        oWSData.period.searchTerms.push(oSelectedFeatureSpaceData.from);
                        oWSData.period.searchTerms.push(oSelectedFeatureSpaceData.to);
                        // set fullscreen for bubble chart
                        oWSData.fullScreen = true;
                        oWSData.browsingView = "BubbleChart";
                        // and entity details as filter
                        var oFilterInitial = {
                            "valueRange" : {
                                "operator" : "=",
                                "searchTerms" : [],
                                "searchTermRefKeys" : []
                            },
                            "workspaceContext" : "Path1.Subset",
                            "luid" : 1,
                            "context" : "Log",
                            "key" : "",
                            "displayName" : "",
                            "description" : "",
                            "dataType" : "ValueVarChar",
                            "filterOperators" : [ "=", "LIKE", "IN", "IN VALUE LIST" ],
                            "isFieldRef" : 0,
                            "count" : "-1",
                            "isEnumeration" : false
                        };
                        $.each(_that._selectedEntityValue.entity, function(idx, oEntity) {
                            var oFilter = $.extend(true, {}, oFilterInitial);
                            oFilter.workspaceContext = oFilter.workspaceContext + (idx + 1);
                            oFilter.luid = idx + 1;
                            oFilter.key = oEntity.key;
                            oFilter.valueRange.searchTerms.push(oEntity.value);
                            oFilter.displayName = oEntity.name;
                            oFilter.description = oEntity.name;
                            oWSData.paths[0].filters.push(oFilter);

                        });
                        oWSData.selectedSubsetId = oWSData.paths[0].filters[oWSData.paths[0].filters.length - 1].workspaceContext;
                        // navigate to FL
                        _that._oNavigationHelper.navigate({
                            newWindow : true,
                            url : "/sap/secmon/ui/browse/",
                            data : {
                                data : oWSData,
                                operation : 'OUTLIER'
                            }
                        }, function() {
                        }, function() {
                        });
                    },
                    handleReset : function() {
                        // call spider to remove sunburst
                        _that._oVisualization.hideDetails();
                    }
                };
                if (!this._oSunburstContextMenue) {
                    this._oSunburstContextMenue = sap.ui.xmlfragment("_sunburstContextMenue", "sap.secmon.ui.m.anomaly.ui.OutlierDetectionContextMenue", oInlineController);
                    this._oSunburstContextMenue.setModel(oOutlierUIModel);
                }

                var selectedEntity = oEvent.getParameter("entity");

                jQuery.sap.syncStyleClass("sapUiSizeCompact", selectedEntity, this._oSunburstContextMenue);

                this._oSunburstContextMenue.openBy(selectedEntity.target);

            }, this ]
        });
        return this._oVisualization;
    },

    _createVizLayout : function() {
        var oLayout = new sap.ui.commons.layout.MatrixLayout({
            layoutFixed : true,
            widths : [ "67%", "33%" ],
            columns : 2
        });

        // spider + distribution charts + outlier table
        oLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                vAlign : sap.ui.commons.layout.VAlign.Top,
                hAlign : sap.ui.commons.layout.HAlign.left,
                content : [ this._createSpider() ]
            }), new sap.ui.commons.layout.MatrixLayoutCell({
                vAlign : sap.ui.commons.layout.VAlign.Top,
                hAlign : sap.ui.commons.layout.HAlign.Begin,
                content : [ this._createOutlierTable() ]
            }) ]
        }));
        return oLayout;
    },

    /**
     * private methods
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.AnomalyPatterns
     */
    _editPatternAndTimerange : function() {
        var _that = this;
        var oDialog = new sap.m.Dialog({
            draggable : true,
            title : this.getText("BU_FLOD_TOL_PatternTime"),
            contentWidth : "500px",
            contentHeight : "250px",
            buttons : [ new sap.m.Button({
                text : this.getText("OK_TXT"),
                tooltip : this.getText("BU_FLOD_TOL_PatternTime"),
                press : function(oEvent) {
                    var oSelectedEntity = oDialog.getContent()[0].getContent()[1];
                    var bIsUTC = _that.getModel('applicationContext').getData().UTC;
                    var oDatePicker = oDialog.getContent()[0].getContent()[3], oTimePicker;
                    var sDateFrom = oDatePicker.getValue();

                    if (sDateFrom === null) {
                        oDatePicker.setValueState(sap.ui.core.ValueState.Error);
                        return;
                    }
                    oDatePicker.setValueState(sap.ui.core.ValueState.None);

                    oTimePicker = oDialog.getContent()[0].getContent()[4];

                    var iTimeFrom = parseInt(oTimePicker.getSelectedKey());
                    var oDateFrom = new Date(sDateFrom);
                    var oDateTo = new Date(sDateFrom);

                    if (bIsUTC) {
                        // add timeoffset
                        iTimeFrom = (iTimeFrom - oDateFrom.getTimezoneOffset() / 60);
                    }
                    oDateFrom = new Date(oDateFrom.getTime() + 3600 * 1000 * iTimeFrom);
                    oDateTo = new Date(oDateTo.getTime() + 3600 * 1000 * (iTimeFrom + 1));

                    var sDateTimeFrom = new sap.secmon.ui.commons.CommonFunctions().formatDateTime(oDateFrom);
                    var sDateTimeTo = new sap.secmon.ui.commons.CommonFunctions().formatDateTime(oDateTo);

                    var oSelectedFeature = _that.getModel("SelectedFeatureSpace");
                    var oSelectedFeatureData = oSelectedFeature.getData();
                    // getAllValue from Entity Selection PopUp
                    // and update
                    // SelectedFeatureModel
                    var items = oSelectedEntity.getItems();
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].getId() === sap.ui.getCore().byId("entitySelected").getSelectedItemId()) {
                            oSelectedFeatureData.entity.id = items[i].getKey();
                            oSelectedFeatureData.entity.name = items[i].getText();
                            oSelectedFeatureData.entity.nameSpace = items[i].getAdditionalText();
                            break;
                        }
                    }
                    oSelectedFeatureData.from = sDateTimeFrom;
                    oSelectedFeatureData.to = sDateTimeTo;

                    // referencing workspace
                    var aFeatureSpaceList = _that.getModel("FeatureSpaceListModel").getData();
                    $.each(aFeatureSpaceList, function(idx, oFSpace) {
                        if (oFSpace.id === oSelectedFeatureData.entity.id) {
                            oSelectedFeatureData.workspace = oFSpace.workspace;
                            return false;
                        }
                    });
                    oSelectedFeature.setData(oSelectedFeatureData);
                    // set navigation info
                    var sPatternId = new sap.secmon.ui.commons.CommonFunctions().base64ToHex(oSelectedFeatureData.entity.id);
                    _that.getParent().getParent().getController().navigateToObject(sPatternId, oSelectedFeatureData.from, oSelectedFeatureData.to);
                    oDialog.destroy();
                }

            }), new sap.m.Button({
                text : this.getText("Cancel_TXT"),
                tooltip : this.getText("Cancel_TXT"),
                press : function(oEvent) {
                    oDialog.destroy();
                }
            }) ]
        });

        oDialog.addContent(_that._createEntitySelection());
        oDialog.open();
    },
    /**
     * private methods
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.AnomalyPatterns
     */
    _editPatternSimulation : function() {
        var _that = this;
        var oDialog = new sap.m.Dialog({
            draggable : true,
            title : this.getText("SimulatePattern_TOL"),
            contentWidth : "600px",
            contentHeight : "200px",
            buttons : [ new sap.m.Button({
                text : this.getText("OK_TXT"),
                tooltip : this.getText("SimulatePattern_TOL"),
                press : function(oEvent) {
                    // adapt changes
                    var oFeatureSpaceModel = _that.getModel("FeatureSpaceModel");
                    oFeatureSpaceModel.setProperty("/Pattern/func", oDialog.getContent()[0].getContent()[1].getSelectedKey());
                    oFeatureSpaceModel.setProperty("/Pattern/outliersOnly", (!oDialog.getContent()[0].getContent()[3].getSelected()));
                    _that._setVisualizationData(oFeatureSpaceModel);
                    oDialog.destroy();
                }
            }), new sap.m.Button({
                text : this.getText("Cancel_TXT"),
                tooltip : this.getText("Cancel_TXT"),
                press : function(oEvent) {
                    oDialog.destroy();
                }
            }) ]
        });

        oDialog.addContent(_that._createPatternSimulation());
        oDialog.open();
    },
    _buildMainUI : function() {
        var _that = this;
        // 2nd row containing titles
        var oMLayout = new sap.ui.commons.layout.MatrixLayout({
            width : "100%",
            height : "100%",
            layoutFixed : false,
            widths : [ "67%", "33%" ],
            columns : 2
        }).addStyleClass("sapEtdBackgroundWhite");

        // Vis-Area
        oMLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : ($(window).height() - this._usedHeight) * 0.7 - 37 + "px",
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                vAlign : sap.ui.commons.layout.VAlign.Top,
                hAlign : sap.ui.commons.layout.HAlign.Center,
                content : [ this._createVizLayout() ]
            }) ]
        }));

        // Slider
        oMLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                vAlign : sap.ui.commons.layout.VAlign.Top,
                hAlign : sap.ui.commons.layout.HAlign.Center,
                content : [ this._createSlider() ]
            }).addStyleClass("sapETDMBorderStyle") ]
        }));

        // build main, which is the page
        this._oPage = new sap.m.Page({
            enableScrolling : false,
            title : {
                parts : [ {
                    path : "SelectedFeatureSpace>/entity/nameSpace"
                }, {
                    path : "SelectedFeatureSpace>/entity/name",
                }, {
                    path : "SelectedFeatureSpace>/from"
                }, {
                    path : "SelectedFeatureSpace>/to"
                }, {
                    path : 'applicationContext>/UTC'
                } ],
                formatter : function(sNamespace, sName, sFrom, sTo, isUTC) {
                    var timerange, pattern;
                    if (sFrom && sTo) {
                        var sDateFrom = sap.secmon.ui.commons.Formatter.dateFormatterEx(isUTC, sFrom, 'short', 'short');
                        var sDateTo = sap.secmon.ui.commons.Formatter.dateFormatterEx(isUTC, sTo, 'short', 'short');
                        timerange = _that.getText("TimeRange_LBL") + ': ' + sDateFrom + " - " + sDateTo + (isUTC === true ? ' UTC' : '');
                    } else {
                        timerange = _that.getText("TimeRange_LBL") + 'n/a ';
                    }
                    if (sName) {
                        if (sNamespace) {
                            pattern = _that.getText("Pattern_TXT") + ': ' + sNamespace + ': ' + sName;
                        } else {
                            pattern = _that.getText("Pattern_TXT") + ': ' + sName;
                        }
                    } else {
                        pattern = _that.getText("Pattern_TXT") + 'n/a';
                    }
                    return pattern + '; ' + timerange;
                }
            },
            showHeader : true,
            headerContent : [ new sap.m.Button({
                icon : "sap-icon://edit",
                type : 'Transparent',
                tooltip : "{i18n>BU_FLOD_TOL_PatternTime}",
                press : [ function(oEvent) {
                    this._editPatternAndTimerange();
                }, this ]
            }), new sap.m.Button({
                icon : "sap-icon://action-settings",
                type : 'Transparent',
                tooltip : "{i18n>SimulatePattern_TOL}",
                press : [ function(oEvent) {
                    this._editPatternSimulation();
                }, this ]
            }), new sap.m.Button({
                icon : "sap-icon://sys-help-2",
                type : 'Transparent',
                tooltip : "{i18n>OpenHelp_TTP}",
                press : [ function(oEvent) {
                    window.open("/sap/secmon/help/506ae29e562f44fe9872c1f9a0f28c9e.html");
                }, this ]
            }) ],
            showSubHeader : false,
            content : [ oMLayout ]
        });
    },
    _handleShowDetails : function(data, features) {
        var _that = this;
        var selectedEntity = data;
        var sFeatureSpaceId;
        var oSelectedFeatureSpace = this.getModel("SelectedFeatureSpace").getData();
        sFeatureSpaceId = oSelectedFeatureSpace.entity.id;
        var aEntity = [];
        $.each(this._aKBInfo, function(idx, oKb) {
            aEntity.push({
                key : oKb.key,
                name : oKb.displayName,
                value : selectedEntity.entity[idx + 1]
            });
        });
        // input parameter for backend call
        var oPayload = {
            "patternId" : new sap.secmon.ui.commons.CommonFunctions().base64ToHex(sFeatureSpaceId),
            "fromTimestamp" : oSelectedFeatureSpace.from,
            "toTimestamp" : oSelectedFeatureSpace.to,
            "operation" : "GET_ENTITY_DETAILS",
            "entity" : aEntity,
            "features" : features
        };
        this._oPage.setBusy(true);
        new sap.secmon.ui.commons.AjaxUtil().postJson(sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_PATTERN_DATA, JSON.stringify(oPayload)).done(function(response, textStatus, XMLHttpRequest) {
            _that._oPage.setBusy(false);
            _that._oVisualization.showDetails(selectedEntity, response);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            if (_that._oPage) {
                _that._oPage.setBusy(false);
            }
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, _that.getText("Error_TIT"), jqXHR.responseText);
        });
    }
});