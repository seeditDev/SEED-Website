/*
 * Slow implementation of AES in JavaScript.
 */

var slowAES = {
    /*
     * The number of rounds in AES Cipher.
     */
    numberOfRounds: {
        'AES-128': 10,
        'AES-192': 12,
        'AES-256': 14
    },

    /*
     * The S-box table.
     */
    sbox: [
        0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
        0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
        0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
        0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
        0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
        0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
        0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
        0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
        0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
        0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
        0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
        0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
        0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
        0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
        0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
        0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
    ],

    /*
     * Transformation for encryption process.
     */
    encrypt: function(input, w) {
        var Nb = 4;
        var Nr = this.numberOfRounds['AES-128'];
        var state = [[], [], [], []];
        var i;
        var round;

        for (i = 0; i < 4 * Nb; i++) {
            state[i % 4][Math.floor(i / 4)] = input[i];
        }

        this.addRoundKey(state, w, 0, Nb);

        for (round = 1; round < Nr; round++) {
            this.subBytes(state, Nb);
            this.shiftRows(state, Nb);
            this.mixColumns(state, Nb);
            this.addRoundKey(state, w, round, Nb);
        }

        this.subBytes(state, Nb);
        this.shiftRows(state, Nb);
        this.addRoundKey(state, w, Nr, Nb);

        var output = new Array(4 * Nb);
        for (i = 0; i < 4 * Nb; i++) {
            output[i] = state[i % 4][Math.floor(i / 4)];
        }
        return output;
    },

    /*
     * Transformation for decryption process.
     */
    decrypt: function(input, w) {
        var Nb = 4;
        var Nr = this.numberOfRounds['AES-128'];
        var state = [[], [], [], []];
        var i;
        var round;

        for (i = 0; i < 4 * Nb; i++) {
            state[i % 4][Math.floor(i / 4)] = input[i];
        }

        this.addRoundKey(state, w, Nr, Nb);

        for (round = Nr - 1; round > 0; round--) {
            this.invShiftRows(state, Nb);
            this.invSubBytes(state, Nb);
            this.addRoundKey(state, w, round, Nb);
            this.invMixColumns(state, Nb);
        }

        this.invShiftRows(state, Nb);
        this.invSubBytes(state, Nb);
        this.addRoundKey(state, w, 0, Nb);

        var output = new Array(4 * Nb);
        for (i = 0; i < 4 * Nb; i++) {
            output[i] = state[i % 4][Math.floor(i / 4)];
        }
        return output;
    },

    /*
     * Apply SBox to state array.
     */
    subBytes: function(state, Nb) {
        var r, c;
        for (r = 0; r < 4; r++) {
            for (c = 0; c < Nb; c++) {
                state[r][c] = this.sbox[state[r][c]];
            }
        }
    },

    /*
     * Shift rows of state array.
     */
    shiftRows: function(state, Nb) {
        var temp = new Array(4);
        var r;
        var c;
        for (r = 1; r < 4; r++) {
            for (c = 0; c < 4; c++) {
                temp[c] = state[r][(c + r) % Nb];
            }
            for (c = 0; c < 4; c++) {
                state[r][c] = temp[c];
            }
        }
    },

    /*
     * Mix columns of state array.
     */
    mixColumns: function(state, Nb) {
        var a = new Array(4);
        var b = new Array(4);
        var c;
        var i;
        var r;

        for (c = 0; c < Nb; c++) {
            for (r = 0; r < 4; r++) {
                a[r] = state[r][c];
                b[r] = (state[r][c] & 0x80) ? ((state[r][c] << 1) ^ 0x011b) : (state[r][c] << 1);
            }

            state[0][c] = b[0] ^ a[1] ^ b[1] ^ a[2] ^ a[3];
            state[1][c] = a[0] ^ b[1] ^ a[2] ^ b[2] ^ a[3];
            state[2][c] = a[0] ^ a[1] ^ b[2] ^ a[3] ^ b[3];
            state[3][c] = a[0] ^ b[0] ^ a[1] ^ a[2] ^ b[3];
        }
    },

    /*
     * Add round key to state array.
     */
    addRoundKey: function(state, w, rnd, Nb) {
        var r, c;
        for (r = 0; r < 4; r++) {
            for (c = 0; c < Nb; c++) {
                state[r][c] ^= w[rnd * 4 + c][r];
            }
        }
    }
};

// Make it available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = slowAES;
} else {
    window.slowAES = slowAES;
} 