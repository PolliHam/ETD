jQuery.sap.require("sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper");

var libUnderTest;

beforeEach(function() {

});

afterEach(function() {
});

describe("DateTimeSelectionHelper Tests", function() {
    var oView = jasmine.createSpyObj('oView', [ "byId", "getModel" ]);
    var oModel = {};
    oModel.getData = function() {
        return {UTC:false};
    };
    oView.getModel.and.callFake(function() {
      return oModel;
    });
    var toDate = new Date();
    var fromDate = toDate;
    toDate.setDate(fromDate.getDate() - 1);

    var sTime = fromDate.toTimeString();
    sTime = sTime.substring(0, 8);
    function setSpyOnById(selection) {
        var bRelative = false;
        var bNoSelection;

        if (selection === "relative") {
            bRelative = true;
        } else if (selection === "absolute") {
            bRelative = false;
        } else {
            bNoSelection = true;
        }
        oView.byId.and.callFake(function(id) {
            switch (id) {
            case "relativeTimeRange":
                return {
                    getSelected : function() {
                        if (!bNoSelection) {
                            return bRelative;
                        } else {
                            return this.selected;
                        }
                    },
                    setSelected : function(selection) {
                        this.selected = selection;
                    }
                };
            case "absoluteTimeRange":
                return {
                    getSelected : function() {
                        return !bRelative;
                    },
                    setSelected : function() {
                    }
                };
            case "inputTimeLast":
                var oInputTimeLast;
                oInputTimeLast = {
                    getValue : function() {
                        return "2";
                    },
                    setValue : function() {
                    }
                };
                return oInputTimeLast;
            case "selectTimeLast":
                var oSelectTimeLast;
                oSelectTimeLast = {
                    getSelectedKey : function() {
                        return "hours";
                    },
                    setSelectedKey : function() {
                    }
                };
                return oSelectTimeLast;

            case "datePickerTimeRangeFrom":
                return {
                    getDateValue : function() {
                        return fromDate;
                    },
                    setDateValue : function() {
                    },
                    setValueState : function() {
                    }
                };

            case "datePickerTimeRangeTo":
                return {
                    getDateValue : function() {
                        return toDate;
                    },
                    setDateValue : function() {
                    },
                    setValueState : function() {
                    }
                };

            case "inputTimeRangeFrom":

                return {
                    getValue : function() {
                        return sTime;
                    },
                    setValue : function() {
                    },
                    setValueState : function() {
                    }
                };
            case "inputTimeRangeTo":

                return {
                    getValue : function() {
                        return sTime;
                    },
                    setValue : function() {
                    },
                    setValueState : function() {
                    }
                };
            }
        });
    }

    
    it("getDefaultSelectionAsObject", function() {

        libUnderTest = new sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper(oView);

        var result = libUnderTest.getDefaultSelectionAsObject.call();
        expect(result.timeSelectionType).toEqual("relative");
        expect(result.timeLast).toEqual("1");
        expect(result.timeType).toEqual("days");

    });

    it("getSelectionAsObjectRelativeTimeRange", function() {

        setSpyOnById("relative");
        libUnderTest = new sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper(oView);

        var result = libUnderTest.getSelectionAsObject.call(libUnderTest);
        expect(result.timeSelectionType).toEqual("relative");
        expect(result.timeLast).toEqual("2");
        expect(result.timeType).toEqual("hours");

    });

    it("getSelectionAsObjectAbsoluteTimeRange", function() {

        setSpyOnById("absolute");

        libUnderTest = new sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper(oView);

        var result = libUnderTest.getSelectionAsObject.call(libUnderTest);
        expect(result.timeSelectionType).toEqual("absolute");
        var sFromDate = fromDate.getTime() + "";
        var sToDate = toDate.getTime() + "";

        expect(result.timeFromDate).toEqual(sFromDate);
        expect(result.timeToDate).toEqual(sToDate);

    });
    it("getTimeRangeUnderConsideration", function() {
        libUnderTest = new sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper(oView);
        setSpyOnById("relative");

        var result = libUnderTest.getTimeRangeUnderConsideration.call(libUnderTest, true);
        expect(result[0]).toBeDefined();
        expect(result[1]).toBeDefined();
        setSpyOnById("absolute");
        result = libUnderTest.getTimeRangeUnderConsideration.call(libUnderTest);
        expect(result[0]).toBeDefined();
        expect(result[1]).toBeDefined();
    });
    it("reset", function() {
        libUnderTest = new sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper(oView);
        setSpyOnById();

        libUnderTest.reset.call(libUnderTest);
        expect(oView.byId).toHaveBeenCalledWith("relativeTimeRange");

    });
    it("selectFromObject", function() {
        libUnderTest = new sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper(oView);
        setSpyOnById();
        libUnderTest.selectFromObject.call(libUnderTest, {
            timeSelectionType : "relative"
        });
        expect(oView.byId).toHaveBeenCalledWith("relativeTimeRange");

        libUnderTest.selectFromObject.call(libUnderTest, {
            timeSelectionType : "absolute"
        });
        expect(oView.byId).toHaveBeenCalledWith("relativeTimeRange");

    });

});