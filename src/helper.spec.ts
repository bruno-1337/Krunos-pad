import pathToRoomName from './helper';

describe("Helper test", function() {

    beforeEach(function() {
        // Any setup needed before each test
    });

    it("Test convert path to room name start with bar", function() {
        const roomName = pathToRoomName('/krunos/a');
        expect(roomName).toEqual('krunos.a.content');
    });

    it("Test convert path to room name contains double bars", function() {
        const roomName = pathToRoomName('//krunos//a');
        expect(roomName).toEqual('krunos.a.content');
    });

    it("Test convert path to room name contains multi bars", function() {
        const roomName = pathToRoomName('//krunos/a//');
        expect(roomName).toEqual('krunos.a.content');
    });

    it("Test convert path to room name contains end bars", function() {
        const roomName = pathToRoomName('//krunos/a/');
        expect(roomName).toEqual('krunos.a.content');
    });

    it("Test convert path to room name simple path", function() {
        const roomName = pathToRoomName('a/a');
        expect(roomName).toEqual('a.a.content');
    });

});
