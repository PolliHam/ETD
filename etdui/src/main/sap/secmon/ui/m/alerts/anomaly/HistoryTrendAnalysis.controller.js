jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.alerts.anomaly.HistoryTrendAnalysis", {

    /**
     * These values must match with the Feed values of the VizFrame object in the view
     */
    FEEDS : {
        // category axis
        DIMENSION : {
            HOUR : "Hour"
        },
        // value axis
        MEASURE : {
            DATE : "Date",
            COUNT : "Count",
            // Bubble chart needs a bubble size. For us, it's a
            // constant value.
            DUMMY_VALUE : " "
        }
    },

    onInit : function() {
        var view = this.getView();
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();

        this.uiModel = new sap.ui.model.json.JSONModel({
            loading : true,
            loaded : false,
            meanVisible : true,
            standardDeviationVisible : true,
            thresholdVisible : true,
            currentVisible : true,
        });

        view.setModel(this.uiModel, "uiModel");

        // set i18n anomaly model
        this.i18nAnomalyModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/m/alerts/anomaly/i18n/UIText.hdbtextbundle"
        });
        view.setModel(this.i18nAnomalyModel, "i18nAnomaly");

        var lineChart = this.getView().byId("lineChart");

        // Some fields of VizFrame need to be set delayed
        var controller = this;
        var renderCompleteHook = function() {
            // Setting axis labels directly does not work for unknown reasons.
            // Might work with later versions of SAPUI5 ???
            var vizProps = controller.getVizProperties();
            var titleTemplate = controller.getAnomalyText("MAnomaly_history");
            var oContext = this.getBindingContext();
            var oMinTimestamp = oContext.getProperty("ReferenceStartTimestamp");
            var utc = controller.UTC();
            var titleText = controller.i18nText(titleTemplate, oMinTimestamp ? sap.secmon.ui.commons.Formatter.weekdayFormatter(utc, oMinTimestamp) : "");
            vizProps.title.text = titleText;
            vizProps.title.visible = true;

            vizProps.plotArea.colorPalette = this.getModel("uiModel").getData().chartColorPalette;
            vizProps.plotArea.animation = {
                dataLoading : false,
                resizing : false,
                dataUpdating : false
            };

            // date axis
            // A reference line is shown if the value matches with a data point on the value axis.
            // The value axis contains equidistant millisecond values in intervals of 1 week.
            // The weekday starts at midnoght (UTC).
            vizProps.plotArea.referenceLine.line.valueAxis.push({
                value : sap.secmon.ui.m.alerts.util.Formatter.startOfDayInUTCMilliseconds(oMinTimestamp),
                visible : true,
                size : 1,
                type : "line",
                label : {
                    visible : true,
                    text : sap.secmon.ui.commons.Formatter.dateOnlyFormatter(utc, oMinTimestamp)
                }
            });
            // The above reference line sometimes does not show.
            // It seems that the VizFrame when fed with milliseconds, internally interprets it as local time.
            // So we feed it another reference line with a value in local time:
            vizProps.plotArea.referenceLine.line.valueAxis.push({
                value : sap.secmon.ui.m.alerts.util.Formatter.startOfDayInLocalMilliseconds(oMinTimestamp),
                visible : true,
                size : 1,
                type : "line",
                label : {
                    visible : false
                }
            });

            // measure axis
            var mean = +oContext.getProperty("Mean");
            var deviation = +oContext.getProperty("Deviation");
            var upperDeviation = mean + deviation;
            var lowerDeviation = mean - deviation;
            vizProps.plotArea.referenceLine.line.valueAxis2.push({ // average
                value : mean,
                visible : true,
                size : 1,
                type : "dotted",
                label : {
                    visible : true,
                    text : controller.getAnomalyText("MAnomaly_Mean")
                }
            }, {
                // upper std. deviation
                value : upperDeviation,
                visible : true,
                size : 1,
                type : "line",
                label : {
                    visible : true,
                    text : controller.getAnomalyText("MAnomaly_upStdDeviation")
                }
            }, {
                // lower std. deviation
                value : lowerDeviation,
                visible : true,
                size : 1,
                type : "line",
                label : {
                    visible : true,
                    text : controller.getAnomalyText("MAnomaly_loStdDeviation")
                }
            });

            vizProps.legend.title.text = utc === true ? controller.getAnomalyText("MAnomaly_timeUTCAxis") : controller.getAnomalyText("MAnomaly_timeAxis");
            vizProps.valueAxis.title.text = controller.getAnomalyText("MAnomaly_DateAxis");
            vizProps.valueAxis2.title.text = controller.getAnomalyText("MAnomaly_Cnt");
            this.setVizProperties(vizProps);

            this.detachRenderComplete(renderCompleteHook, this);

        };
        lineChart.attachRenderComplete(renderCompleteHook, lineChart);

    },

    onAfterRendering : function() {
        var view = this.getView();
        var dataModel = view.getModel();
        if (view.getBinding()) {
            this.uiModel.setProperty("/loaded", true);
            this.uiModel.setProperty("/loading", false);
        } else {
            dataModel.attachRequestCompleted(function() {
                this.uiModel.setProperty("/loaded", true);
                this.uiModel.setProperty("/loading", false);
            }, this);
        }

        // the dataset contains UTC info which is not available yet on onInit
        var lineChart = this.getView().byId("lineChart");
        lineChart.setDataset(this.getDataset());

    },

    onToggleLabelButton : function(oEvent) {
        var lineChart = this.getView().byId("lineChart");
        var vizProps = lineChart.getVizProperties();
        vizProps.plotArea.dataLabel.visible = !vizProps.plotArea.dataLabel.visible;
        lineChart.setVizProperties(vizProps);
    },

    onToggleLegendButton : function(oEvent) {
        var lineChart = this.getView().byId("lineChart");
        var vizProps = lineChart.getVizProperties();
        vizProps.sizeLegend = {
            visible : false
        };
        vizProps.legend.visible = !vizProps.legend.visible;
        lineChart.setVizProperties(vizProps);
    },

    /**
     * Returns the text value with the given text key from the i18nAnomaly model.
     */
    getAnomalyText : function(sTextKey) {
        return this.i18nAnomalyModel ? this.i18nAnomalyModel.getProperty(sTextKey) : sTextKey;
    },

    getVizProperties : function() {
        var vizProps = {
            legend : {
                visible : sap.ui.Device.system.phone ? false : true,
                title : {
                    visible : true,
                    text : this.getAnomalyText("MAnomaly_timeAxis")
                }
            },
            valueAxis : {
                visible : true,
                label : {
                    // Caution: The formatting seems to be done in local time?
                    // Undocumented! It also affects adding a reference line.
                    formatString : [ [ "mm d" ] ]
                },
                title : {
                    visible : true,
                    text : this.getAnomalyText("MAnomaly_DateAxis")
                }
            },
            valueAxis2 : {
                visible : true,
                label : {
                    formatString : [ [ "#" ] ]
                },
                title : {
                    visible : true,
                    text : this.getAnomalyText("MAnomaly_Cnt")
                }
            },
            sizeLegend : {
                visible : false
            },
            title : {
                visible : false
            },
            plotArea : {
                width : 3,
                animation : {
                    dataLoading : true,
                    resizing : true,
                    dataUpdating : true
                },
                dataLabel : {
                    visible : false,
                    renderer : function(oDataLabel) {
                        var value = oDataLabel.ctx;
                        oDataLabel.text = value.Count;
                    },
                // style : {
                // fontSize : "1.15rem"
                // }

                },
                referenceLine : {
                    line : {
                        valueAxis : [],
                        valueAxis2 : []
                    }
                }
            }
        };
        return vizProps;
    },

    getDataset : function() {
        var controller = this;

        // The dimension fields do not support multi-parameter binding. So we need to curry down the 2-param formatter to a 1-param formatter.
        function timeOnlyFormatter(oDate) {
            var utc = controller.UTC();
            return sap.secmon.ui.commons.Formatter.timeOnlyFormatter(utc, oDate);
        }

        var oSorter = new sap.ui.model.Sorter("FromTimestamp", false);
        var dataset = new sap.viz.ui5.data.FlattenedDataset({
            dimensions : [ {
                name : this.FEEDS.DIMENSION.HOUR,
                value : {
                    path : "FromTimestamp",
                    formatter : timeOnlyFormatter
                }
            } ],
            measures : [ {
                name : this.FEEDS.MEASURE.DUMMY_VALUE,
                value : "{DummyValue}"
            }, {
                name : this.FEEDS.MEASURE.DATE,
                value : {
                    path : "FromTimestamp",
                    // Caution: It seems that for the chart
                    // "time_bubble" the
                    // time axis must have equidistant values.
                    // Otherwise, VizFrame might hang.
                    // The formatter does exactly that. The returned milliseconds are relative
                    // to UTC, equidistance cannot be warranted at all times with local time.
                    formatter : sap.secmon.ui.m.alerts.util.Formatter.startOfDayInUTCMilliseconds
                }
            }, {
                name : this.FEEDS.MEASURE.COUNT,
                value : "{MeasureValue}"
            } ],
            data : {
                path : "DayHourData",
                sorter : oSorter
            }
        });

        return dataset;
    },

});
