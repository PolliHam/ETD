jQuery.sap.require("sap.ui.model.odata.CountMode");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
var oCommons = new sap.secmon.ui.commons.CommonFunctions();

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.systems.view.EventTrendAnalysis", {

    SERVICE_URL : "/sap/secmon/services/ui/m/systems/timeslots2.xsjs?systemId=",
    MEASUREMENTS_URL : "/sap/secmon/ui/browse/services2/Qube.xsodata",
    DEFAULT_TIMESLOTSIZE_IN_MINUTES : 60,

    /**
     * These values must coincide with feed values of VizFrame object in view
     */
    FEEDS : {
        DIMENSION : {
            TIME : "Time",
            DAY : "Day"
        },

        MEASURE : {
            EVENTS : "Events"
        }
    },

    /**
     * set Chart "alerty by Time" as default
     */
    DEFAULT_CHART : "VNDm+qCIKjLhAAAACkzxCQ==",

    ZOOM_TIMESLOTSIZE_IN_MINUTES : 10,

    DEFAULT_FROM : "00:00",

    DEFAULT_TO : "23:59",
    selectedChart : null,

    constructor : function() {
        sap.secmon.ui.m.commons.EtdController.apply(this, arguments);
    },

    onInit : function() {
        // var CHART_ALERTS_BY_TIME = "VNDm+qCIKjLhAAAACkzxCQ==";
        var view = this.getView();
        this.dataModel = new sap.ui.model.json.JSONModel();

        this.oDataModel = this.getComponent().getModel();
        var timeslotSize = jQuery.sap.getUriParameters().get("timeslotSize") || this.DEFAULT_TIMESLOTSIZE_IN_MINUTES;

        var from = jQuery.sap.getUriParameters().get("from") || this.DEFAULT_FROM;
        var to = jQuery.sap.getUriParameters().get("to") || this.DEFAULT_TO;
        var today = new Date();

        this.uiModel = new sap.ui.model.json.JSONModel({
            timeslotSize : timeslotSize,
            day : today,
            from : from,
            to : to,
            loading : true,
            chart : ""
        });

        // holds time ranges in minutes
        this.timeRangeModel = new sap.ui.model.json.JSONModel([ {
            key : 5
        }, {
            key : 10
        }, {
            key : 15
        }, {
            key : 20
        }, {
            key : 30
        }, {
            key : 60
        } ]);

        this.chartModel = new sap.ui.model.odata.ODataModel(this.MEASUREMENTS_URL, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.chartModel.attachRequestCompleted(function() {
            var charts = this.chartModel.oData;
            var firstChart, firstChartId;
            for ( var prop in charts) {
                var chart = charts[prop];
                var chartName = chart.Name;
                if (chartName.localeCompare(firstChart) === -1 || chart.Id === this.DEFAULT_CHART) {
                    firstChart = chart;
                    firstChartId = chart.Id;
                }

            }
            var uiData = this.uiModel.getData();
            uiData.chart = firstChartId;
            this.uiModel.setData(uiData);
            return;
        }, this);

        view.setModel(this.dataModel, "dataModel");
        view.setModel(this.uiModel, "uiModel");
        view.setModel(this.chartModel, "chartModel");
        view.setModel(this.timeRangeModel, "timeRange");

        var lineChart = this.getView().byId("lineChart");

        // Some fields of VizFrame need to be set delayed
        var controller = this;
        var renderCompleteHook = function() {
            // Setting axis labels directly does not work for unknown reasons.
            // Might work with later versions of SAPUI5 ???
            var vizProps = this.getVizProperties();
            vizProps.title.text = controller.getText("MEventTrend_Title");
            vizProps.valueAxis.title.text = controller.getText("MEventTrend_Events");
            vizProps.legend.title.text = controller.getText("MEventTrend_DayDim");
            vizProps.categoryAxis.title.text = controller.UTC() === true ? controller.getText("MEventTrend_TimeUTCDim") : controller.getText("MEventTrend_TimeDim");
            this.setVizProperties(vizProps);
            this.detachRenderComplete(renderCompleteHook, this);
        };
        lineChart.attachRenderComplete(renderCompleteHook, lineChart);
    },

    onAfterRendering : function() {
        // the dataset contains UTC info which is not available yet on onInit
        var lineChart = this.getView().byId("lineChart");
        lineChart.setDataset(this.getDataset(this));

        if (this.selectedChart) {
            var chartInput = this.byId("chartInput");
            if (this.selectedChart !== chartInput.getSelectedItem) {
                chartInput.setSelectedItem(this.selectedChart);
            }
        }
    },

    /**
     * date : Date(), time : HH:MM
     */
    getDateFromDateAndTime : function(oDate, time) {
        var sYear, sMonth, sDate;
        if (this.UTC() === true) {
            sYear = oDate.getUTCFullYear();
            sMonth = oDate.getUTCMonth();
            sDate = oDate.getUTCDate();
        } else {
            sYear = oDate.getFullYear();
            sMonth = oDate.getMonth();
            sDate = oDate.getDate();
        }
        var hourMins = time.split(":");
        if (this.UTC() === true) {
            return new Date(Date.UTC(sYear, sMonth, sDate, hourMins[0], hourMins[1], 0));
        } else {
            return new Date(sYear, sMonth, sDate, hourMins[0], hourMins[1], 0);
        }
    },

    onChartSelected : function(oEvent) {
        this.selectedChart = this.byId("chartInput").getSelectedItem();
        this.updateData();
    },
    updateData : function() {
        var controller = this;
        var systemId = this.uiModel.getProperty("/systemId");
        var timeslotSize = this.uiModel.getProperty("/timeslotSize");

        var fromTime = this.uiModel.getProperty("/from"); // HH:MM
        var toTime = this.uiModel.getProperty("/to");

        var day = this.uiModel.getProperty("/day");

        var fromDate = this.getDateFromDateAndTime(day, fromTime);
        var toDate = this.getDateFromDateAndTime(day, toTime);

        var chart = this.uiModel.getProperty('/chart');
        if (!chart) {
            chart = this.DEFAULT_CHART;
        }
        controller.uiModel.setProperty("/loading", true);

        var loading = this.loadData(systemId, timeslotSize, fromDate, toDate, chart);
        var results = {
            result : []
        };
        loading.done(function(response) {
            results.result = response.result.map(function(x) {
                var dateObject = new Date(x.Timestamp);
                return {
                    Timestamp : dateObject,
                    Events : x.Events
                };
            }, controller);
            controller.dataModel.setData(results);
        }).always(function() {
            controller.uiModel.setProperty("/loading", false);

        }).fail(function() {
            sap.m.MessageBox.alert(controller.getText("MEventTrend_Error"), {
                title : controller.getCommonText("Error_TIT")
            });
        });
    },

    /**
     * @return jQuery Deferred()
     */
    loadData : function(systemId, timeslotSize, from, to, chart) {
        var url = this.SERVICE_URL + systemId + "&timeslotSize=" + timeslotSize + "&from=" + from.getTime() + "&to=" + to.getTime();
        // Convert the base64 UUID to Hex, in order to transfer it secure to the
        // backend
        var chartId = oCommons.base64ToHex(chart);
        if (chart && chart.length > 0) {
            url += "&type=" + chartId;
        }
        return $.ajax({
            url : url,
            dataType : "json"
        });
    },

    /**
     * Handler for data selection within the line chart.
     */
    onDataSelect : function(event) {
        var lineChart = this.getView().byId("lineChart");
        var selectedPoints = lineChart.selection();
        var selectedTimeRange = this.getSelectedTimeRange(selectedPoints);

        // the following coding is needed to ensure that the chart is not
        // refreshed if nodes are selected via legend.
        // legend needs to be selectable, because the selected line is
        // highlighted.
        // the coding compares if all datasets from one day are completely
        // selected or nothing is selected in those cases the chart must not be
        // refreshed
        var chartModel = this.getView().getModel("dataModel");
        var modelData = chartModel.oData.result;

        var Day1, Day2, Day3, modelDayCounter1, modelDayCounter2, modelDayCounter3;
        modelData.forEach(function(data) {
            if (!Day1) {
                Day1 = data.Day;
                modelDayCounter1 = 1;
            } else if (data.Day === Day1) {
                modelDayCounter1++;
            } else if (!Day2) {
                Day2 = data.Day;
                modelDayCounter2 = 1;
            } else if (data.Day === Day2) {
                modelDayCounter2++;
            } else if (!Day3) {
                Day3 = data.Day;
                modelDayCounter3 = 1;
            } else if (data.Day === Day3) {
                modelDayCounter3++;
            }
        });
        var pointsDayCounter1 = 0, pointsDayCounter2 = 0, pointsDayCounter3 = 0;
        selectedPoints.forEach(function(data) {
            if (data.data.Day === Day1) {
                pointsDayCounter1++;
            } else if (data.data.Day === Day2) {
                pointsDayCounter2++;
            } else if (data.data.Day === Day3) {
                pointsDayCounter3++;
            }
        });
        if ((pointsDayCounter1 === 0 || pointsDayCounter1 === modelDayCounter1) && (pointsDayCounter2 === 0 || pointsDayCounter2 === modelDayCounter2) &&
                (pointsDayCounter3 === 0 || pointsDayCounter3 === modelDayCounter3)) {
            return;
        }

        var from = selectedTimeRange[0];
        var to = selectedTimeRange[1];
        // toTimeString is calculated based on last Chart point + timeInterval
        // timeInterval in Minutes
        var timeInterval = +this.getView().byId("timeInterval").getSelectedKey();

        // add timeInterval to "to"
        // "to" is a string ( e.g. 23:59)
        var tosplit = to.split(":");
        var toDate;
        if (this.UTC() === true) {
            toDate = new Date(Date.UTC(1, 0, 0, tosplit[0], tosplit[1], 0));
            toDate.setUTCMinutes(toDate.getUTCMinutes() + timeInterval);
        } else {
            toDate = new Date(1, 0, 0, tosplit[0], tosplit[1], 0);
            toDate.setMinutes(toDate.getMinutes() + timeInterval);
        }

        var hours = this.UTC() === true ? toDate.getUTCHours() : toDate.getHours();
        if (hours.toString().length === 1) {
            hours = "0" + hours;
        }
        var minutes = this.UTC() === true ? toDate.getUTCMinutes() : toDate.getMinutes();
        if (minutes.toString().length === 1) {
            minutes = "0" + minutes;
        }
        var toTimeString = hours + ":" + minutes;
        // check needed, because otherwise the toTimeString would be 00:00, then
        // the chart cannot be displayed
        if (to > toTimeString) {
            toTimeString = '23:59';
        }

        var oldFrom = this.uiModel.getProperty("/from");
        var oldTo = this.uiModel.getProperty("/to");

        // prevent zooming if only one point was selected
        // or the selection didn´t change
        // or calculation error due to nonsense timeInterval and Time from/to
        // combination
        if (from === toTimeString || (from === oldFrom && toTimeString === oldTo) || from === oldFrom && toTimeString > oldTo) {
            return;
        }

        this.uiModel.setProperty("/from", from);
        this.uiModel.setProperty("/to", toTimeString);
        this.uiModel.setProperty("/timeslotSize", 5);
        this.updateData();
    },

    /**
     * Returns the min and max of the selected times.
     */
    getSelectedTimeRange : function(selectedPoints) {
        var selectedTimes = this.getSelectedTimes(selectedPoints);
        return [ selectedTimes[0], selectedTimes[selectedTimes.length - 1] ];
    },

    /**
     * Returns the sorted times of the selected data points.
     */
    getSelectedTimes : function(selectedPoints) {
        var times = [];
        selectedPoints.forEach(function(value, i) {
            times.push(value.data.Time);
        });
        return times.sort();
    },

    validInput : function() {
        var inputs = [ this.getView().byId("fromInput"), this.getView().byId("toInput") ];
        var valid = true;
        jQuery.each(inputs, function(i, input) {
            if (sap.ui.core.ValueState.Error === input.getValueState()) {
                valid = false;
                return false;
            }
        });
        return valid;
    },

    /**
     * Resets the chart settings to the application default and updates the chart.
     */
    onResetPress : function() {
        this.uiModel.setProperty("/timeslotSize", this.DEFAULT_TIMESLOTSIZE_IN_MINUTES);
        this.uiModel.setProperty("/from", this.DEFAULT_FROM);
        this.uiModel.setProperty("/to", this.DEFAULT_TO);
        this.uiModel.setProperty("/day", new Date());

        this.updateData();
    },

    /**
     * Shift the X-Axis to the left by 20% from the current min time.
     */
    onLeftEarlierPress : function() {
        var span = this.getCurrentTimeSpan();

        var incrementInMinutes = span.spanInMinutes * 0.2;
        var newMin = new Date(span.minDate.getTime());

        if (this.UTC() === true) {
            newMin.setUTCHours(span.minDate.getUTCHours(), -incrementInMinutes);
            // don't go beyond "00:00"
            if (newMin.getUTCDate() !== span.minDate.getUTCDate()) {
                newMin.setUTCHours(0, 0);
            }
            this.uiModel.setProperty("/from", this.formatTime(newMin.getUTCHours(), newMin.getUTCMinutes()));
        } else {
            newMin.setHours(span.minDate.getHours(), -incrementInMinutes);
            // don't go beyond "00:00"
            if (newMin.getDate() !== span.minDate.getDate()) {
                newMin.setHours(0, 0);
            }
            this.uiModel.setProperty("/from", this.formatTime(newMin.getHours(), newMin.getMinutes()));
        }

        this.updateData();
    },

    getCurrentTimeSpan : function() {

        // Alternative: Check all Data Points in the model for min and max Time.
        var timespanMin = this.uiModel.getProperty("/from");
        var timespanMax = this.uiModel.getProperty("/to");

        var minDate = new Date();
        var maxDate = new Date();
        if (this.UTC() === true) {
            minDate.setUTCHours(parseInt(timespanMin.split(":")[0]), parseInt(timespanMin.split(":")[1]));
            maxDate.setUTCHours(parseInt(timespanMax.split(":")[0]), parseInt(timespanMax.split(":")[1]));
        } else {
            minDate.setHours(parseInt(timespanMin.split(":")[0]), parseInt(timespanMin.split(":")[1]));
            maxDate.setHours(parseInt(timespanMax.split(":")[0]), parseInt(timespanMax.split(":")[1]));
        }

        return {
            min : timespanMin,
            max : timespanMax,
            spanInMinutes : Math.round((maxDate.getTime() - minDate.getTime()) / 60000),
            minDate : minDate,
            maxDate : maxDate
        };
    },

    /**
     * Shift the X-Axis to the right by 20% from the current min time.
     */
    onLeftLaterPress : function() {
        var span = this.getCurrentTimeSpan();
        var decrementInMinutes = span.spanInMinutes * 0.2;
        var newMin = new Date(span.minDate.getTime());
        if (this.UTC() === true) {
            newMin.setUTCHours(span.minDate.getUTCHours(), decrementInMinutes);
            this.uiModel.setProperty("/from", this.formatTime(newMin.getUTCHours(), newMin.getUTCMinutes()));
        } else {
            newMin.setHours(span.minDate.getHours(), decrementInMinutes);
            this.uiModel.setProperty("/from", this.formatTime(newMin.getHours(), newMin.getMinutes()));
        }

        this.updateData();
    },

    /**
     * Shift the X-Axis to the left by 20% from the current max time.
     */
    onRightEarlierPress : function() {
        var span = this.getCurrentTimeSpan();
        var decrementInMinutes = span.spanInMinutes * 0.2;
        var newMax = new Date(span.maxDate.getTime());

        // Later: Round new time to the nearest timeslot.
        if (this.UTC() === true) {
            newMax.setUTCHours(span.maxDate.getUTCHours(), -decrementInMinutes);
            this.uiModel.setProperty("/to", this.formatTime(newMax.getUTCHours(), newMax.getUTCMinutes()));
        } else {
            newMax.setHours(span.maxDate.getHours(), -decrementInMinutes);
            this.uiModel.setProperty("/to", this.formatTime(newMax.getHours(), newMax.getMinutes()));
        }
        this.updateData();
    },

    /**
     * Shift the X-Axis to the right by 20% from the current max time.
     */
    onRightLaterPress : function() {
        var span = this.getCurrentTimeSpan();
        var incrementInMinutes = span.spanInMinutes * 0.2;
        var newMax = new Date(span.maxDate.getTime());

        if (this.UTC() === true) {
            newMax.setUTCHours(span.maxDate.getUTCHours(), span.maxDate.getUTCMinutes() + incrementInMinutes);
            // don't go beyond "23:59"
            if (newMax.getUTCDate() !== span.minDate.getUTCDate()) {
                newMax.setUTCHours(23, 59);
            }
            this.uiModel.setProperty("/to", this.formatTime(newMax.getUTCHours(), newMax.getUTCMinutes()));
        } else {
            newMax.setHours(span.maxDate.getHours(), span.maxDate.getMinutes() + incrementInMinutes);
            // don't go beyond "23:59"
            if (newMax.getDate() !== span.minDate.getDate()) {
                newMax.setHours(23, 59);
            }
            this.uiModel.setProperty("/to", this.formatTime(newMax.getHours(), newMax.getMinutes()));
        }

        this.updateData();
    },

    /**
     * Shift the X-Axis to the left by one day.
     */
    onCenterEarlierPress : function() {
        this.shiftDay(-1);
        this.updateData();
    },

    /**
     * Shift the X-Axis to the right by one day.
     */
    onCenterLaterPress : function() {
        this.shiftDay(1);
        this.updateData();
    },

    /**
     * Shifts the day by nDays of the current day.
     */
    shiftDay : function(nDays) {
        var day = this.uiModel.getProperty("/day");
        var newDay = new Date(day.getTime());
        if (this.UTC() === true) {
            newDay.setUTCDate(day.getUTCDate() + nDays);
        } else {
            newDay.setDate(day.getDate() + nDays);
        }
        this.uiModel.setProperty("/day", newDay);
    },

    formatTime : function(hour, minute) {
        if (hour < 10) {
            hour = "0" + hour;
        }
        if (minute < 10) {
            minute = "0" + minute;
        }
        return hour + ":" + minute;
    },

    /**
     * Sets the ValueState according to the pattern HH:MM.
     */
    validateTime : function(oEvent) {
        var regex = /\d\d:\d\d/;
        var source = oEvent.getSource();
        if (!regex.test(source.getValue())) {
            source.setValueState(sap.ui.core.ValueState.Error);
        } else {
            source.setValueState(sap.ui.core.ValueState.None);
            this.updateData();
        }
    },

    /**
     * Used to set/change the systemId by other views/controllers.
     */
    setSystem : function(systemId) {
        this.uiModel.setProperty("/systemId", systemId);
        this.updateData();
    },

    getVizProperties : function() {
        var vizProps = {
            plotArea : {
                colorPalette : [ "#5CBAE6", "#B6D957", "#FAC364", "#c5b0d5", "#8c564b", "#7f7f7f", "#ff7f0e" ]
            },
            legend : {
                visible : true,
                title : {
                    visible : false
                }
            },
            categoryAxis : {
                visible : true,
                title : {
                    text : this.UTC() === true ? this.getText("MEventTrend_TimeUTCDim") : this.getText("MEventTrend_TimeDim"),
                    visible : true
                }
            },
            valueAxis : {
                visible : true,
                title : {
                    visible : false
                }
            },
            valueAxis2 : {
                visible : true,
                title : {
                    visible : false
                }
            },
            title : {
                visible : true,
                text : this.getText("MEventTrend_Title")
            },
        };
        return vizProps;
    },

    getDataset : function(oController) {
        // The dimension and measure fields do not support multi-parameter binding. So we need to curry down the 2-param formatter to a 1-param formatter.
        function timeOnlyFormatter(oDate) {
            var utc = oController.UTC();
            return sap.secmon.ui.commons.Formatter.timeOnlyFormatter(utc, oDate, "HH:mm");
        }

        function dateOnlyFormatter(oDate) {
            var utc = oController.UTC();
            return sap.secmon.ui.commons.Formatter.dateOnlyFormatter(utc, oDate, "medium");
        }

        return new sap.viz.ui5.data.FlattenedDataset({
            // Refer to https://scn.sap.com/thread/3745279:
            // The dimension name (e.g. "Time") must be identical to
            // the corresponding feed item values

            dimensions : [ {
                axis : 1, // must be one for the x-axis, 2 for y-axis
                name : this.FEEDS.DIMENSION.TIME,
                value : {
                    path : "dataModel>Timestamp",
                    formatter : timeOnlyFormatter
                }
            }, {
                axis : 2,
                name : this.FEEDS.DIMENSION.DAY,
                value : {
                    path : "dataModel>Timestamp",
                    formatter : dateOnlyFormatter
                }
            } ],
            measures : [ {
                name : this.FEEDS.MEASURE.EVENTS,
                value : '{dataModel>Events}'
            } ],
            data : {
                path : "dataModel>/result"
            }
        });
    }

});
