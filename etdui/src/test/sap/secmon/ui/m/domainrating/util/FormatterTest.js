jQuery.sap.require("sap.secmon.ui.domainrating.Formatter");



describe("Domainrating Formatter Tests", function () {
    var libUnderTest;
    var spy, oModel;
    beforeEach(function () {
        libUnderTest = sap.secmon.ui.domainrating.Formatter;
    });
    beforeEach(function () {
        spy = jasmine.createSpyObj("controller", ["getModel"]);
        oModel = jasmine.createSpyObj("oModel", ["method", "getProperty"]);
    });


    it("Test type format", function () {
        expect(libUnderTest.formatType("I")).toEqual(true);
        expect(libUnderTest.formatType("A")).toEqual(false);
        expect(libUnderTest.formatType(null)).toEqual(false);
        expect(libUnderTest.formatType(undefined)).toEqual(false);
    });

    it("formatTypeVisibility", function () {
        expect(libUnderTest.formatTypeVisibility("B")).toEqual(true);
        expect(libUnderTest.formatTypeVisibility("A", true)).toEqual(false);
        expect(libUnderTest.formatTypeVisibility("test")).toEqual(false);
        expect(libUnderTest.formatTypeVisibility(null)).toEqual(false);
        expect(libUnderTest.formatTypeVisibility(undefined)).toEqual(false);
    });

    it("formatDLVisibility", function () {
        expect(libUnderTest.formatDLVisibility("DL")).toEqual(true);
        expect(libUnderTest.formatDLVisibility("test_DL")).toEqual(false);
        expect(libUnderTest.formatDLVisibility(null)).toEqual(false);
        expect(libUnderTest.formatDLVisibility(undefined)).toEqual(false);
    });

    it("formatDLVisibilityButton", function () {
        expect(libUnderTest.formatDLVisibilityButton("DL", true)).toEqual(true);
        expect(libUnderTest.formatDLVisibilityButton("DL", false)).toEqual(false);
        expect(libUnderTest.formatDLVisibilityButton("WL", true)).toEqual(false);
        expect(libUnderTest.formatDLVisibilityButton("WL", false)).toEqual(false);
        expect(libUnderTest.formatDLVisibilityButton(null, true)).toEqual(false);
        expect(libUnderTest.formatDLVisibilityButton(undefined, false)).toEqual(false);
    });

    it("formatWLVisibility", function () {
        expect(libUnderTest.formatWLVisibility("WL")).toEqual(true);
        expect(libUnderTest.formatWLVisibility("WL_test")).toEqual(false);
        expect(libUnderTest.formatWLVisibility(null)).toEqual(false);
        expect(libUnderTest.formatWLVisibility(undefined)).toEqual(false);
    });

    it("formatWLVisibilityButton", function () {
        expect(libUnderTest.formatWLVisibilityButton("DL", true)).toEqual(false);
        expect(libUnderTest.formatWLVisibilityButton("DL", false)).toEqual(false);
        expect(libUnderTest.formatWLVisibilityButton("WL", true)).toEqual(true);
        expect(libUnderTest.formatWLVisibilityButton("WL", false)).toEqual(false);
        expect(libUnderTest.formatWLVisibilityButton(null, true)).toEqual(false);
        expect(libUnderTest.formatWLVisibilityButton(undefined, false)).toEqual(false);
    });

    it("formatSelectedButton", function () {
        expect(libUnderTest.formatSelectedButton("WL")).toEqual("showWhiteListButton");
        expect(libUnderTest.formatSelectedButton("DL")).toEqual("showDomainListButton");
    });

});