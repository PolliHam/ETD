jQuery.sap.require({ modName: "sap.secmon.ui.subnets.Main", type: "controller"});

var MainController = sap.secmon.ui.subnets.Main;

describe("Subnets app - Main controller", function(){
	var oController = new MainController();

	it("formats Diffs", function() {
		expect(oController.formatDiffVisible([])).toBe(false);
		expect(oController.formatDiffInvisible([])).toBe(true);

		expect(oController.formatDiffVisible(null)).toBe(false);
		expect(oController.formatDiffInvisible(null)).toBe(true);

		expect(oController.formatDiffVisible(1)).toBe(false);
		expect(oController.formatDiffInvisible(1)).toBe(true);

		expect(oController.formatDiffVisible(undefined)).toBe(false);
		expect(oController.formatDiffInvisible(undefined)).toBe(true);

		expect(oController.formatDiffVisible("katze")).toBe(false);
		expect(oController.formatDiffInvisible("katze")).toBe(true);

		expect(oController.formatDiffVisible(["hund", "katze"])).toBe(true);
		expect(oController.formatDiffInvisible(["hund", "katze"])).toBe(false);
	});

	it("formats Errors", function() {
		expect(oController.formatLineErrors()).toBe(undefined);
		expect(oController.formatLineErrors(null)).toBe(null);
		expect(oController.formatLineErrors("katze")).toBe("katze");
		expect(oController.formatLineErrors([])).toBe("");
		expect(oController.formatLineErrors(["katze"])).toBe("katze");
		expect(oController.formatLineErrors(["hund", "katze"])).toBe("hund\nkatze");
	});

});