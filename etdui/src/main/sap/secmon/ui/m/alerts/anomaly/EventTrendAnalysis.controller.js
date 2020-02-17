jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.alerts.anomaly.EventTrendAnalysis", {

    SERVICE_URL : "/sap/secmon/services/ui/m/alerts/anomaly/timeslots.xsjs",

    /**
     * These values must match with the feed values of the VizFrame object in the view
     */
    FEEDS : {
        // category axis
        DIMENSION : {
            TIME : "Time",
            TYPE : "Type"
        },
        // value axis
        MEASURE : {
            COUNT : "Count"
        },
    },

    COLORS : {
        MEAN : "#90CAF9",
        STANDARD_DEVIATION_MIN : "#2196F3",
        STANDARD_DEVIATION_MAX : "#2196F3",
        THRESHOLD_MIN : "#FF9800",
        THRESHOLD_MAX : "#FF9800",
        CURRENT : "#F44336"
    },

    onInit : function() {
        var view = this.getView();
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.dataModel = new sap.ui.model.json.JSONModel();

        this.colorModel = new sap.ui.model.json.JSONModel(this.COLORS);
        this.uiModel = new sap.ui.model.json.JSONModel({
            loading : true,
            loaded : false,
            meanVisible : true,
            standardDeviationVisible : true,
            thresholdVisible : true,
            currentVisible : true,
            // default color palette contains all charts
            chartColorPalette : [ this.COLORS.MEAN, this.COLORS.STANDARD_DEVIATION_MIN, this.COLORS.STANDARD_DEVIATION_MAX, this.COLORS.THRESHOLD_MIN, this.COLORS.THRESHOLD_MAX, this.COLORS.CURRENT ]
        });

        view.setModel(this.dataModel, "dataModel");
        view.setModel(this.uiModel, "uiModel");
        view.setModel(this.colorModel, "colorModel");

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
            vizProps.title.text = controller.getAnomalyText("MAnomaly_graphXTIT");
            vizProps.valueAxis.title.text = controller.getAnomalyText("MAnomaly_Cnt");
            vizProps.plotArea.colorPalette = this.getModel("uiModel").getData().chartColorPalette;
            vizProps.categoryAxis.title.text = controller.UTC() === true ? controller.getAnomalyText("MAnomaly_timeUTCAxis") : controller.getAnomalyText("MAnomaly_timeAxis");
            this.setVizProperties(vizProps);

            this.detachRenderComplete(renderCompleteHook, this);

        };
        lineChart.attachRenderComplete(renderCompleteHook, lineChart);
    },

    onBeforeRendering : function() {
        var view = this.getView();
        var context = view.getBindingContext();
        var startTimestamp = context.getProperty("ReferenceStartTimestamp");
        var eventCount = context.getProperty("MeasureValue");
        var scoredDataId = context.getProperty("StatisticalScoreDataId.Id");
        var zScoreThreshold = context.getProperty("ZScoreThreshold");
        var includeZeroValues = context.getProperty("IncludeZeroValues");
        this.uiModel.setProperty("/startTimestamp", startTimestamp);
        this.uiModel.setProperty("/eventCount", eventCount);
        this.uiModel.setProperty("/scoredDataId", scoredDataId);
        this.uiModel.setProperty("/zScoreThreshold", zScoreThreshold);
        this.uiModel.setProperty("/includeZeroValues", includeZeroValues);
        this.updateData();
    },

    onAfterRendering : function(oEvent) {
        // the dataset contains UTC info which is not available yet on onInit
        var lineChart = this.getView().byId("lineChart");
        lineChart.setDataset(this.getDataset());
    },

    onLineChange : function(event) {
        this.refreshChart();
    },

    onToggleSettingsButton : function(oEvent) {
        var settingsDialog = this.getSettingsDialog();

        if (settingsDialog.isOpen()) {
            settingsDialog.close();
        } else {
            settingsDialog.openBy(oEvent.getSource());
        }
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
     * Refresh's the chart without loading the data again. This can be useful if chart settings have changed since the last chart rendering, e.g. visible content.
     */
    refreshChart : function() {
        var originalData = this.originalData, newData = [];
        var meanVisible = this.uiModel.getProperty("/meanVisible");
        var standardDeviationVisible = this.uiModel.getProperty("/standardDeviationVisible");
        var thresholdVisible = this.uiModel.getProperty("/thresholdVisible");
        var currentVisible = this.uiModel.getProperty("/currentVisible");

        // add only desired line types to the new data set
        originalData.forEach(function(entry) {
            if (entry.Id === "Mean" && meanVisible) {
                newData.push(entry);
            } else if (entry.Id === "StandardDeviation" && standardDeviationVisible) {
                newData.push(entry);
            } else if (entry.Id === "Threshold" && thresholdVisible) {
                newData.push(entry);
            } else if (entry.Id === "Current" && currentVisible) {
                newData.push(entry);
            }
        });

        var colors = [];
        // update coloring
        if (meanVisible === true) {
            colors.push(this.COLORS.MEAN);
        }

        if (standardDeviationVisible === true) {
            colors.push(this.COLORS.STANDARD_DEVIATION_MIN);
            colors.push(this.COLORS.STANDARD_DEVIATION_MAX);
        }

        if (thresholdVisible === true) {
            colors.push(this.COLORS.THRESHOLD_MIN);
            colors.push(this.COLORS.THRESHOLD_MAX);
        }

        if (currentVisible === true) {
            colors.push(this.COLORS.CURRENT);
        }

        this.uiModel.setProperty("/chartColorPalette", colors);
        this.dataModel.setProperty("/result", newData);
        var vizFrame = this.getView().byId("lineChart");
        var vizProps = vizFrame.getVizProperties();
        if (vizProps && vizProps.plotArea) {
            vizProps.plotArea.colorPalette = colors;
            vizFrame.setVizProperties(vizProps);
        }
    },

    updateData : function() {
        var controller = this;
        var zScoreThreshold = this.uiModel.getProperty("/zScoreThreshold");
        var scoredDataId = this.uiModel.getProperty("/scoredDataId");
        var startTimestamp = this.uiModel.getProperty("/startTimestamp");
        var includeZeroValues = this.uiModel.getProperty("/includeZeroValues");

        controller.uiModel.setProperty("/loading", true);
        controller.uiModel.setProperty("/loaded", false);

        // The client browser knows the time zone (and if daylight savings is
        // active),
        // which is hard to know on the server.
        // So we send a request to load data for the day in question.
        // Depending on daylight saving, the day length may be 23, 24, or 25
        // hours.
        var startOfDay = new Date(startTimestamp.getTime());
        var endOfDay = new Date(startTimestamp.getTime());
        if (this.UTC() === true) {
            startOfDay.setUTCHours(0, 0, 0);
            endOfDay.setUTCHours(23, 0, 0);
        } else {
            startOfDay.setHours(0, 0, 0);
            endOfDay.setHours(23, 0, 0);
        }

        var loading = this.loadData(startOfDay, endOfDay, scoredDataId, zScoreThreshold);
        loading.done(function(response) {

            var aDataWithLocalTime = controller.convertTimeDataToLocal(response.result, startOfDay);
            // enhance data to be used in vizFrame
            var aConvertedData = controller.convertData(aDataWithLocalTime, includeZeroValues);

            // keep a copy of the original response for function refreshChart
            controller.originalData = aConvertedData;

            // update data binding
            controller.refreshChart();

        }).always(function() {
            controller.uiModel.setProperty("/loading", false);
            controller.uiModel.setProperty("/loaded", true);

        }).fail(function() {
            sap.m.MessageBox.alert(controller.getAnomalyText("MAnomaly_Error"), {
                title : controller.getCommonText("Error_TIT")
            });
        });
    },

    /**
     * Convert OData: One response line with fields Date, Dayname, Time, Count, Average, StandardDeviation is adapted to local time.
     * 
     * @param aData
     *            an array of objects with fields Date, Dayname. The time data are based on UTC. The data objects correspond to one hour for one day. Depending on daylight saving, the dy length varies
     *            between 23 and 25 hours.
     * @param startOfDay
     *            Date object, denoting local start of day (local time 00:00)
     * @param endOfDay
     *            Date object, denoting local end of day (local time 23:00)
     * @return aConvertedData an array of objects with fields Date, Dayname, Time. The time data have (Date, Dayname, and Time) been converted to local time.
     */
    convertTimeDataToLocal : function(aData, startOfDay) {
        var aConvertedData = [];
        for (var hour = 0; hour < aData.length; hour++) {
            var currentHour = new Date(startOfDay.getTime() + hour * 60 * 60 * 1000);
            var dataByHour = aData[hour];
            dataByHour.Date = sap.secmon.ui.commons.Formatter.dateOnlyFormatter(this.UTC(), currentHour);
            dataByHour.Dayname = sap.secmon.ui.commons.Formatter.weekdayFormatter(this.UTC(), currentHour);
            dataByHour.Time = sap.secmon.ui.commons.Formatter.timeOnlyFormatter(this.UTC(), currentHour);
            aConvertedData.push(dataByHour);
        }
        return aConvertedData;
    },

    calculateDateString : function(oDate) {
        return oDate.getFullYear() + '-' + (oDate.getMonth() + 1) + '-' + oDate.getDate();
    },

    calculateTimeString : function(oDate) {
        var hoursStr = '' + oDate.getHours();
        var hours2DigitStr = (hoursStr.length % 2 === 0) ? hoursStr : '0' + hoursStr;
        return hours2DigitStr + ':00';
    },

    /**
     * Convert OData: One response line with fields Time, Count, Average, StandardDeviation is split up into 4 lines, the new field "Type" has 4 values: Current, Average, Minimum, and Maximum
     * 
     * @param aData
     *            an array of objects with fields Dayname, Time, Count, Average, StandardDeviation. There should be 24 elements, one for each hour of the day.
     * @return aConvertedData an array of objects with fields Time, Count, Type. There should be between 73 and 96 array elements, 3 to 4 for each hour of the day. The time data have (Date, Dayname,
     *         and Time) been converted to local time.
     */
    convertData : function(aData, bIncludeZeroValues) {
        var aConvertedData = [];
        var currentTxt = this.getAnomalyText("MAnomaly_Curr");
        // upper and lower absolute threshold
        // (z-score threshold * standard-deviation)
        var upperBoundTxt = this.getAnomalyText("MAnomaly_upThreshold");
        var lowerBoundTxt = this.getAnomalyText("MAnomaly_loThreshold");
        var avgText = this.getAnomalyText("MAnomaly_Mean");
        // upper and lower bounds within standard deviation
        var stddevMinText = this.getAnomalyText("MAnomaly_loStdDeviation");
        var stddevMaxText = this.getAnomalyText("MAnomaly_upStdDeviation");
        var average;
        var deviation;
        var minimumCount;
        var maximumCount;

        for (var hour = 0; hour < aData.length; hour++) {
            var dataByHour = aData[hour];

            // Beware: The order of line types determines the order in which the
            // lines are drawn.
            // The current count is drawn last!
            average = dataByHour.Average;
            deviation = dataByHour.StandardDeviation;
            minimumCount = dataByHour.MinimumCount;
            maximumCount = dataByHour.MaximumCount;
            // determine if calculations are done with or without zero values
            if (bIncludeZeroValues === "false") {
                average = dataByHour.AverageWithoutZeroes;
                deviation = dataByHour.StandardDeviationWithoutZeroes;
                minimumCount = dataByHour.MinimumCountWithoutZeroes;
                maximumCount = dataByHour.MaximumCountWithoutZeroes;
            }
            aConvertedData.push({
                Time : dataByHour.Time,
                Count : average,
                Type : avgText,
                Id : "Mean"
            });

            // The count must not be negative
            var stddevMin = average > deviation ? average - deviation : 0;
            aConvertedData.push({
                Time : dataByHour.Time,
                Count : stddevMin,
                Type : stddevMinText,
                Id : "StandardDeviation"
            });
            aConvertedData.push({
                Time : dataByHour.Time,
                Count : average + deviation,
                Type : stddevMaxText,
                Id : "StandardDeviation"
            });

            var minCount = minimumCount > 0 ? minimumCount : 0;
            aConvertedData.push({
                Time : dataByHour.Time,
                Count : minCount,
                Type : lowerBoundTxt,
                Id : "Threshold"
            });
            aConvertedData.push({
                Time : dataByHour.Time,
                Count : maximumCount,
                Type : upperBoundTxt,
                Id : "Threshold"
            });
            var oCurrent = {
                Time : dataByHour.Time,
                // Count : dataByHour.Count,
                Type : currentTxt,
                Id : "Current"
            };
            if (dataByHour.Count !== null && dataByHour.Count !== undefined) {
                oCurrent.Count = dataByHour.Count;
            }
            aConvertedData.push(oCurrent);

        }
        return aConvertedData;
    },

    /**
     * @return jQuery Deferred() load data from server. The time data on the server are based on UTC.
     */
    loadData : function(startOfDay, endOfDay, scoredDataId, zScoreThreshold) {

        var hexId = this.oCommons.base64ToHex(scoredDataId);
        var startOfDayInMillis = startOfDay.getTime();
        var endOfDayInMillis = endOfDay.getTime();
        var url = this.SERVICE_URL + "?scoredDataId=" + hexId + "&referenceFromInMillis=" + startOfDayInMillis + "&referenceToInMillis=" + endOfDayInMillis + "&zScoreThreshold=" + zScoreThreshold;

        return $.ajax({
            url : url,
            dataType : "json"
        });
    },

    /**
     * Used to set/change the anomaly data by other views/controllers.
     * 
     * @param anomalyDetectionId
     *            allows to retrieve BaselineConfiguration
     * @param dimensionId
     *            ID of dimension (e.g. ID for systems)
     * @param dimensionValue
     *            a value, e.g. name of a system
     * @param startTimestamp
     *            The timestamp of the one-hour-interval in which the anomaly occured. Example: We gathered that an unusually high number of events occured on May 1st, 2015, between 12:00 and 13:00.
     *            In this case, the required startTimestamp would be May 1st, 2015, 12:00.
     * @param eventCount
     *            event count of anomaly
     * @param anomalyId
     *            ID of anomaly
     */
    setAnomalyData : function(anomalyDetectionId, startTimestamp, eventCount, anomalyId) {
        this.uiModel.setProperty("/startTimestamp", startTimestamp);
        this.uiModel.setProperty("/eventCount", eventCount);
        this.uiModel.setProperty("/anomalyDetectionId", anomalyDetectionId);
        this.uiModel.setProperty("/anomalyId", anomalyId);
        this.updateData();
    },

    /**
     * Returns the text value with the given text key from the i18nAnomaly model.
     */
    getAnomalyText : function(sTextKey) {
        return this.i18nAnomalyModel ? this.i18nAnomalyModel.getProperty(sTextKey) : sTextKey;
    },

    getSettingsDialog : function() {
        if (!this.settingsDialog) {
            jQuery.sap.includeStyleSheet("/sap/secmon/ui/commons/controls/css/Legend.css");
            this.settingsDialog = sap.ui.xmlfragment("sap.secmon.ui.m.alerts.anomaly.ChartSettingsPopover", this);
            this.getView().addDependent(this.settingsDialog);
        }
        return this.settingsDialog;
    },

    /**
     * @return an sap.viz.ui5.data.FlattenedDataset object suitable to display 1 dimension (current events), and 4 measures (the current events themselves, average, minimum, and maximum). The average
     *         has been set aggregated over a specified baseline (e.g. last month), the minimum is the average - standard deviation. The maximum is the average + standard deviation.
     */
    getDataset : function() {
        var dataset = new sap.viz.ui5.data.FlattenedDataset({
            dimensions : [ {
                axis : 1,
                name : this.FEEDS.DIMENSION.TIME,
                value : "{dataModel>Time}"
            }, {
                axis : 2,
                name : this.FEEDS.DIMENSION.TYPE,
                value : "{dataModel>Type}"
            } ],
            measures : [ {
                name : this.FEEDS.MEASURE.COUNT,
                value : {
                    path : "dataModel>Count",
                    formatter : sap.secmon.ui.m.alerts.util.Formatter.floatFormatter
                }

            } ],
            data : {
                path : "dataModel>/result"
            }
        });

        return dataset;
    },

    getVizProperties : function() {
        var vizProps = {
            legend : {
                visible : sap.ui.Device.system.phone ? false : true,
                title : {
                    visible : false
                }
            },
            categoryAxis : {
                visible : true,
                title : {
                    visible : true,
                    text : this.getAnomalyText("MAnomaly_timeAxis")
                }
            },
            valueAxis : {
                visible : true,
                title : {
                    visible : true,
                    text : this.getAnomalyText("MAnomaly_Cnt")
                }
            },
            title : {
                visible : true,
                text : this.getAnomalyText("MAnomaly_graphXTIT")
            },
            plotArea : {
                width : 3,
                dataLabel : {
                    visible : false
                }
            }
        };
        return vizProps;
    }

});
