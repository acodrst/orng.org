/*! pako 2.1.0 https://github.com/nodeca/pako @license (MIT AND Zlib) */
// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

/* eslint-disable space-unary-ops */

/* Public constants ==========================================================*/
/* ===========================================================================*/


//const Z_FILTERED          = 1;
//const Z_HUFFMAN_ONLY      = 2;
//const Z_RLE               = 3;
const Z_FIXED$1               = 4;
//const Z_DEFAULT_STRATEGY  = 0;

/* Possible values of the data_type field (though see inflate()) */
const Z_BINARY              = 0;
const Z_TEXT                = 1;
//const Z_ASCII             = 1; // = Z_TEXT
const Z_UNKNOWN$1             = 2;

/*============================================================================*/


function zero$1(buf) { let len = buf.length; while (--len >= 0) { buf[len] = 0; } }

// From zutil.h

const STORED_BLOCK = 0;
const STATIC_TREES = 1;
const DYN_TREES    = 2;
/* The three kinds of block type */

const MIN_MATCH$1    = 3;
const MAX_MATCH$1    = 258;
/* The minimum and maximum match lengths */

// From deflate.h
/* ===========================================================================
 * Internal compression state.
 */

const LENGTH_CODES$1  = 29;
/* number of length codes, not counting the special END_BLOCK code */

const LITERALS$1      = 256;
/* number of literal bytes 0..255 */

const L_CODES$1       = LITERALS$1 + 1 + LENGTH_CODES$1;
/* number of Literal or Length codes, including the END_BLOCK code */

const D_CODES$1       = 30;
/* number of distance codes */

const BL_CODES$1      = 19;
/* number of codes used to transfer the bit lengths */

const HEAP_SIZE$1     = 2 * L_CODES$1 + 1;
/* maximum heap size */

const MAX_BITS$1      = 15;
/* All codes must not exceed MAX_BITS bits */

const Buf_size      = 16;
/* size of bit buffer in bi_buf */


/* ===========================================================================
 * Constants
 */

const MAX_BL_BITS = 7;
/* Bit length codes must not exceed MAX_BL_BITS bits */

const END_BLOCK   = 256;
/* end of block literal code */

const REP_3_6     = 16;
/* repeat previous bit length 3-6 times (2 bits of repeat count) */

const REPZ_3_10   = 17;
/* repeat a zero length 3-10 times  (3 bits of repeat count) */

const REPZ_11_138 = 18;
/* repeat a zero length 11-138 times  (7 bits of repeat count) */

/* eslint-disable comma-spacing,array-bracket-spacing */
const extra_lbits =   /* extra bits for each length code */
  new Uint8Array([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0]);

const extra_dbits =   /* extra bits for each distance code */
  new Uint8Array([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13]);

const extra_blbits =  /* extra bits for each bit length code */
  new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7]);

const bl_order =
  new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]);
/* eslint-enable comma-spacing,array-bracket-spacing */

/* The lengths of the bit length codes are sent in order of decreasing
 * probability, to avoid transmitting the lengths for unused bit length codes.
 */

/* ===========================================================================
 * Local data. These are initialized only once.
 */

// We pre-fill arrays with 0 to avoid uninitialized gaps

const DIST_CODE_LEN = 512; /* see definition of array dist_code below */

// !!!! Use flat array instead of structure, Freq = i*2, Len = i*2+1
const static_ltree  = new Array((L_CODES$1 + 2) * 2);
zero$1(static_ltree);
/* The static literal tree. Since the bit lengths are imposed, there is no
 * need for the L_CODES extra codes used during heap construction. However
 * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
 * below).
 */

const static_dtree  = new Array(D_CODES$1 * 2);
zero$1(static_dtree);
/* The static distance tree. (Actually a trivial tree since all codes use
 * 5 bits.)
 */

const _dist_code    = new Array(DIST_CODE_LEN);
zero$1(_dist_code);
/* Distance codes. The first 256 values correspond to the distances
 * 3 .. 258, the last 256 values correspond to the top 8 bits of
 * the 15 bit distances.
 */

const _length_code  = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);
zero$1(_length_code);
/* length code for each normalized match length (0 == MIN_MATCH) */

const base_length   = new Array(LENGTH_CODES$1);
zero$1(base_length);
/* First normalized length for each code (0 = MIN_MATCH) */

const base_dist     = new Array(D_CODES$1);
zero$1(base_dist);
/* First normalized distance for each code (0 = distance of 1) */


function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {

  this.static_tree  = static_tree;  /* static tree or NULL */
  this.extra_bits   = extra_bits;   /* extra bits for each code or NULL */
  this.extra_base   = extra_base;   /* base index for extra_bits */
  this.elems        = elems;        /* max number of elements in the tree */
  this.max_length   = max_length;   /* max bit length for the codes */

  // show if `static_tree` has data or dummy - needed for monomorphic objects
  this.has_stree    = static_tree && static_tree.length;
}


let static_l_desc;
let static_d_desc;
let static_bl_desc;


function TreeDesc(dyn_tree, stat_desc) {
  this.dyn_tree = dyn_tree;     /* the dynamic tree */
  this.max_code = 0;            /* largest code with non zero frequency */
  this.stat_desc = stat_desc;   /* the corresponding static tree */
}



const d_code = (dist) => {

  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
};


/* ===========================================================================
 * Output a short LSB first on the stream.
 * IN assertion: there is enough room in pendingBuf.
 */
const put_short = (s, w) => {
//    put_byte(s, (uch)((w) & 0xff));
//    put_byte(s, (uch)((ush)(w) >> 8));
  s.pending_buf[s.pending++] = (w) & 0xff;
  s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
};


/* ===========================================================================
 * Send a value on a given number of bits.
 * IN assertion: length <= 16 and value fits in length bits.
 */
const send_bits = (s, value, length) => {

  if (s.bi_valid > (Buf_size - length)) {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    put_short(s, s.bi_buf);
    s.bi_buf = value >> (Buf_size - s.bi_valid);
    s.bi_valid += length - Buf_size;
  } else {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    s.bi_valid += length;
  }
};


const send_code = (s, c, tree) => {

  send_bits(s, tree[c * 2]/*.Code*/, tree[c * 2 + 1]/*.Len*/);
};


/* ===========================================================================
 * Reverse the first len bits of a code, using straightforward code (a faster
 * method would use a table)
 * IN assertion: 1 <= len <= 15
 */
const bi_reverse = (code, len) => {

  let res = 0;
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while (--len > 0);
  return res >>> 1;
};


/* ===========================================================================
 * Flush the bit buffer, keeping at most 7 bits in it.
 */
const bi_flush = (s) => {

  if (s.bi_valid === 16) {
    put_short(s, s.bi_buf);
    s.bi_buf = 0;
    s.bi_valid = 0;

  } else if (s.bi_valid >= 8) {
    s.pending_buf[s.pending++] = s.bi_buf & 0xff;
    s.bi_buf >>= 8;
    s.bi_valid -= 8;
  }
};


/* ===========================================================================
 * Compute the optimal bit lengths for a tree and update the total bit length
 * for the current block.
 * IN assertion: the fields freq and dad are set, heap[heap_max] and
 *    above are the tree nodes sorted by increasing frequency.
 * OUT assertions: the field len is set to the optimal bit length, the
 *     array bl_count contains the frequencies for each bit length.
 *     The length opt_len is updated; static_len is also updated if stree is
 *     not null.
 */
const gen_bitlen = (s, desc) => {
//    deflate_state *s;
//    tree_desc *desc;    /* the tree descriptor */

  const tree            = desc.dyn_tree;
  const max_code        = desc.max_code;
  const stree           = desc.stat_desc.static_tree;
  const has_stree       = desc.stat_desc.has_stree;
  const extra           = desc.stat_desc.extra_bits;
  const base            = desc.stat_desc.extra_base;
  const max_length      = desc.stat_desc.max_length;
  let h;              /* heap index */
  let n, m;           /* iterate over the tree elements */
  let bits;           /* bit length */
  let xbits;          /* extra bits */
  let f;              /* frequency */
  let overflow = 0;   /* number of elements with bit length too large */

  for (bits = 0; bits <= MAX_BITS$1; bits++) {
    s.bl_count[bits] = 0;
  }

  /* In a first pass, compute the optimal bit lengths (which may
   * overflow in the case of the bit length tree).
   */
  tree[s.heap[s.heap_max] * 2 + 1]/*.Len*/ = 0; /* root of the heap */

  for (h = s.heap_max + 1; h < HEAP_SIZE$1; h++) {
    n = s.heap[h];
    bits = tree[tree[n * 2 + 1]/*.Dad*/ * 2 + 1]/*.Len*/ + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n * 2 + 1]/*.Len*/ = bits;
    /* We overwrite tree[n].Dad which is no longer needed */

    if (n > max_code) { continue; } /* not a leaf node */

    s.bl_count[bits]++;
    xbits = 0;
    if (n >= base) {
      xbits = extra[n - base];
    }
    f = tree[n * 2]/*.Freq*/;
    s.opt_len += f * (bits + xbits);
    if (has_stree) {
      s.static_len += f * (stree[n * 2 + 1]/*.Len*/ + xbits);
    }
  }
  if (overflow === 0) { return; }

  // Tracev((stderr,"\nbit length overflow\n"));
  /* This happens for example on obj2 and pic of the Calgary corpus */

  /* Find the first bit length which could increase: */
  do {
    bits = max_length - 1;
    while (s.bl_count[bits] === 0) { bits--; }
    s.bl_count[bits]--;      /* move one leaf down the tree */
    s.bl_count[bits + 1] += 2; /* move one overflow item as its brother */
    s.bl_count[max_length]--;
    /* The brother of the overflow item also moves one step up,
     * but this does not affect bl_count[max_length]
     */
    overflow -= 2;
  } while (overflow > 0);

  /* Now recompute all bit lengths, scanning in increasing frequency.
   * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
   * lengths instead of fixing only the wrong ones. This idea is taken
   * from 'ar' written by Haruhiko Okumura.)
   */
  for (bits = max_length; bits !== 0; bits--) {
    n = s.bl_count[bits];
    while (n !== 0) {
      m = s.heap[--h];
      if (m > max_code) { continue; }
      if (tree[m * 2 + 1]/*.Len*/ !== bits) {
        // Tracev((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
        s.opt_len += (bits - tree[m * 2 + 1]/*.Len*/) * tree[m * 2]/*.Freq*/;
        tree[m * 2 + 1]/*.Len*/ = bits;
      }
      n--;
    }
  }
};


/* ===========================================================================
 * Generate the codes for a given tree and bit counts (which need not be
 * optimal).
 * IN assertion: the array bl_count contains the bit length statistics for
 * the given tree and the field len is set for all tree elements.
 * OUT assertion: the field code is set for all tree elements of non
 *     zero code length.
 */
const gen_codes = (tree, max_code, bl_count) => {
//    ct_data *tree;             /* the tree to decorate */
//    int max_code;              /* largest code with non zero frequency */
//    ushf *bl_count;            /* number of codes at each bit length */

  const next_code = new Array(MAX_BITS$1 + 1); /* next code value for each bit length */
  let code = 0;              /* running code value */
  let bits;                  /* bit index */
  let n;                     /* code index */

  /* The distribution counts are first used to generate the code values
   * without bit reversal.
   */
  for (bits = 1; bits <= MAX_BITS$1; bits++) {
    code = (code + bl_count[bits - 1]) << 1;
    next_code[bits] = code;
  }
  /* Check that the bit counts in bl_count are consistent. The last code
   * must be all ones.
   */
  //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
  //        "inconsistent bit counts");
  //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

  for (n = 0;  n <= max_code; n++) {
    let len = tree[n * 2 + 1]/*.Len*/;
    if (len === 0) { continue; }
    /* Now reverse the bits */
    tree[n * 2]/*.Code*/ = bi_reverse(next_code[len]++, len);

    //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
    //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
  }
};


/* ===========================================================================
 * Initialize the various 'constant' tables.
 */
const tr_static_init = () => {

  let n;        /* iterates over tree elements */
  let bits;     /* bit counter */
  let length;   /* length value */
  let code;     /* code value */
  let dist;     /* distance index */
  const bl_count = new Array(MAX_BITS$1 + 1);
  /* number of codes at each bit length for an optimal tree */

  // do check in _tr_init()
  //if (static_init_done) return;

  /* For some embedded targets, global variables are not initialized: */
/*#ifdef NO_INIT_GLOBAL_POINTERS
  static_l_desc.static_tree = static_ltree;
  static_l_desc.extra_bits = extra_lbits;
  static_d_desc.static_tree = static_dtree;
  static_d_desc.extra_bits = extra_dbits;
  static_bl_desc.extra_bits = extra_blbits;
#endif*/

  /* Initialize the mapping length (0..255) -> length code (0..28) */
  length = 0;
  for (code = 0; code < LENGTH_CODES$1 - 1; code++) {
    base_length[code] = length;
    for (n = 0; n < (1 << extra_lbits[code]); n++) {
      _length_code[length++] = code;
    }
  }
  //Assert (length == 256, "tr_static_init: length != 256");
  /* Note that the length 255 (match length 258) can be represented
   * in two different ways: code 284 + 5 bits or code 285, so we
   * overwrite length_code[255] to use the best encoding:
   */
  _length_code[length - 1] = code;

  /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
  dist = 0;
  for (code = 0; code < 16; code++) {
    base_dist[code] = dist;
    for (n = 0; n < (1 << extra_dbits[code]); n++) {
      _dist_code[dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: dist != 256");
  dist >>= 7; /* from now on, all distances are divided by 128 */
  for (; code < D_CODES$1; code++) {
    base_dist[code] = dist << 7;
    for (n = 0; n < (1 << (extra_dbits[code] - 7)); n++) {
      _dist_code[256 + dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: 256+dist != 512");

  /* Construct the codes of the static literal tree */
  for (bits = 0; bits <= MAX_BITS$1; bits++) {
    bl_count[bits] = 0;
  }

  n = 0;
  while (n <= 143) {
    static_ltree[n * 2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  while (n <= 255) {
    static_ltree[n * 2 + 1]/*.Len*/ = 9;
    n++;
    bl_count[9]++;
  }
  while (n <= 279) {
    static_ltree[n * 2 + 1]/*.Len*/ = 7;
    n++;
    bl_count[7]++;
  }
  while (n <= 287) {
    static_ltree[n * 2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  /* Codes 286 and 287 do not exist, but we must include them in the
   * tree construction to get a canonical Huffman tree (longest code
   * all ones)
   */
  gen_codes(static_ltree, L_CODES$1 + 1, bl_count);

  /* The static distance tree is trivial: */
  for (n = 0; n < D_CODES$1; n++) {
    static_dtree[n * 2 + 1]/*.Len*/ = 5;
    static_dtree[n * 2]/*.Code*/ = bi_reverse(n, 5);
  }

  // Now data ready and we can init static trees
  static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS$1 + 1, L_CODES$1, MAX_BITS$1);
  static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0,          D_CODES$1, MAX_BITS$1);
  static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0,         BL_CODES$1, MAX_BL_BITS);

  //static_init_done = true;
};


/* ===========================================================================
 * Initialize a new block.
 */
const init_block = (s) => {

  let n; /* iterates over tree elements */

  /* Initialize the trees. */
  for (n = 0; n < L_CODES$1;  n++) { s.dyn_ltree[n * 2]/*.Freq*/ = 0; }
  for (n = 0; n < D_CODES$1;  n++) { s.dyn_dtree[n * 2]/*.Freq*/ = 0; }
  for (n = 0; n < BL_CODES$1; n++) { s.bl_tree[n * 2]/*.Freq*/ = 0; }

  s.dyn_ltree[END_BLOCK * 2]/*.Freq*/ = 1;
  s.opt_len = s.static_len = 0;
  s.sym_next = s.matches = 0;
};


/* ===========================================================================
 * Flush the bit buffer and align the output on a byte boundary
 */
const bi_windup = (s) =>
{
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    //put_byte(s, (Byte)s->bi_buf);
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
};

/* ===========================================================================
 * Compares to subtrees, using the tree depth as tie breaker when
 * the subtrees have equal frequency. This minimizes the worst case length.
 */
const smaller = (tree, n, m, depth) => {

  const _n2 = n * 2;
  const _m2 = m * 2;
  return (tree[_n2]/*.Freq*/ < tree[_m2]/*.Freq*/ ||
         (tree[_n2]/*.Freq*/ === tree[_m2]/*.Freq*/ && depth[n] <= depth[m]));
};

/* ===========================================================================
 * Restore the heap property by moving down the tree starting at node k,
 * exchanging a node with the smallest of its two sons if necessary, stopping
 * when the heap property is re-established (each father smaller than its
 * two sons).
 */
const pqdownheap = (s, tree, k) => {
//    deflate_state *s;
//    ct_data *tree;  /* the tree to restore */
//    int k;               /* node to move down */

  const v = s.heap[k];
  let j = k << 1;  /* left son of k */
  while (j <= s.heap_len) {
    /* Set j to the smallest of the two sons: */
    if (j < s.heap_len &&
      smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
      j++;
    }
    /* Exit if v is smaller than both sons */
    if (smaller(tree, v, s.heap[j], s.depth)) { break; }

    /* Exchange v with the smallest son */
    s.heap[k] = s.heap[j];
    k = j;

    /* And continue down the tree, setting j to the left son of k */
    j <<= 1;
  }
  s.heap[k] = v;
};


// inlined manually
// const SMALLEST = 1;

/* ===========================================================================
 * Send the block data compressed using the given Huffman trees
 */
const compress_block = (s, ltree, dtree) => {
//    deflate_state *s;
//    const ct_data *ltree; /* literal tree */
//    const ct_data *dtree; /* distance tree */

  let dist;           /* distance of matched string */
  let lc;             /* match length or unmatched char (if dist == 0) */
  let sx = 0;         /* running index in sym_buf */
  let code;           /* the code to send */
  let extra;          /* number of extra bits to send */

  if (s.sym_next !== 0) {
    do {
      dist = s.pending_buf[s.sym_buf + sx++] & 0xff;
      dist += (s.pending_buf[s.sym_buf + sx++] & 0xff) << 8;
      lc = s.pending_buf[s.sym_buf + sx++];
      if (dist === 0) {
        send_code(s, lc, ltree); /* send a literal byte */
        //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
      } else {
        /* Here, lc is the match length - MIN_MATCH */
        code = _length_code[lc];
        send_code(s, code + LITERALS$1 + 1, ltree); /* send the length code */
        extra = extra_lbits[code];
        if (extra !== 0) {
          lc -= base_length[code];
          send_bits(s, lc, extra);       /* send the extra length bits */
        }
        dist--; /* dist is now the match distance - 1 */
        code = d_code(dist);
        //Assert (code < D_CODES, "bad d_code");

        send_code(s, code, dtree);       /* send the distance code */
        extra = extra_dbits[code];
        if (extra !== 0) {
          dist -= base_dist[code];
          send_bits(s, dist, extra);   /* send the extra distance bits */
        }
      } /* literal or match pair ? */

      /* Check that the overlay between pending_buf and sym_buf is ok: */
      //Assert(s->pending < s->lit_bufsize + sx, "pendingBuf overflow");

    } while (sx < s.sym_next);
  }

  send_code(s, END_BLOCK, ltree);
};


/* ===========================================================================
 * Construct one Huffman tree and assigns the code bit strings and lengths.
 * Update the total bit length for the current block.
 * IN assertion: the field freq is set for all tree elements.
 * OUT assertions: the fields len and code are set to the optimal bit length
 *     and corresponding code. The length opt_len is updated; static_len is
 *     also updated if stree is not null. The field max_code is set.
 */
const build_tree = (s, desc) => {
//    deflate_state *s;
//    tree_desc *desc; /* the tree descriptor */

  const tree     = desc.dyn_tree;
  const stree    = desc.stat_desc.static_tree;
  const has_stree = desc.stat_desc.has_stree;
  const elems    = desc.stat_desc.elems;
  let n, m;          /* iterate over heap elements */
  let max_code = -1; /* largest code with non zero frequency */
  let node;          /* new node being created */

  /* Construct the initial heap, with least frequent element in
   * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
   * heap[0] is not used.
   */
  s.heap_len = 0;
  s.heap_max = HEAP_SIZE$1;

  for (n = 0; n < elems; n++) {
    if (tree[n * 2]/*.Freq*/ !== 0) {
      s.heap[++s.heap_len] = max_code = n;
      s.depth[n] = 0;

    } else {
      tree[n * 2 + 1]/*.Len*/ = 0;
    }
  }

  /* The pkzip format requires that at least one distance code exists,
   * and that at least one bit should be sent even if there is only one
   * possible code. So to avoid special checks later on we force at least
   * two codes of non zero frequency.
   */
  while (s.heap_len < 2) {
    node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0);
    tree[node * 2]/*.Freq*/ = 1;
    s.depth[node] = 0;
    s.opt_len--;

    if (has_stree) {
      s.static_len -= stree[node * 2 + 1]/*.Len*/;
    }
    /* node is 0 or 1 so it does not have extra bits */
  }
  desc.max_code = max_code;

  /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
   * establish sub-heaps of increasing lengths:
   */
  for (n = (s.heap_len >> 1/*int /2*/); n >= 1; n--) { pqdownheap(s, tree, n); }

  /* Construct the Huffman tree by repeatedly combining the least two
   * frequent nodes.
   */
  node = elems;              /* next internal node of the tree */
  do {
    //pqremove(s, tree, n);  /* n = node of least frequency */
    /*** pqremove ***/
    n = s.heap[1/*SMALLEST*/];
    s.heap[1/*SMALLEST*/] = s.heap[s.heap_len--];
    pqdownheap(s, tree, 1/*SMALLEST*/);
    /***/

    m = s.heap[1/*SMALLEST*/]; /* m = node of next least frequency */

    s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
    s.heap[--s.heap_max] = m;

    /* Create a new node father of n and m */
    tree[node * 2]/*.Freq*/ = tree[n * 2]/*.Freq*/ + tree[m * 2]/*.Freq*/;
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n * 2 + 1]/*.Dad*/ = tree[m * 2 + 1]/*.Dad*/ = node;

    /* and insert the new node in the heap */
    s.heap[1/*SMALLEST*/] = node++;
    pqdownheap(s, tree, 1/*SMALLEST*/);

  } while (s.heap_len >= 2);

  s.heap[--s.heap_max] = s.heap[1/*SMALLEST*/];

  /* At this point, the fields freq and dad are set. We can now
   * generate the bit lengths.
   */
  gen_bitlen(s, desc);

  /* The field len is now set, we can generate the bit codes */
  gen_codes(tree, max_code, s.bl_count);
};


/* ===========================================================================
 * Scan a literal or distance tree to determine the frequencies of the codes
 * in the bit length tree.
 */
const scan_tree = (s, tree, max_code) => {
//    deflate_state *s;
//    ct_data *tree;   /* the tree to be scanned */
//    int max_code;    /* and its largest code of non zero frequency */

  let n;                     /* iterates over all tree elements */
  let prevlen = -1;          /* last emitted length */
  let curlen;                /* length of current code */

  let nextlen = tree[0 * 2 + 1]/*.Len*/; /* length of next code */

  let count = 0;             /* repeat count of the current code */
  let max_count = 7;         /* max repeat count */
  let min_count = 4;         /* min repeat count */

  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code + 1) * 2 + 1]/*.Len*/ = 0xffff; /* guard */

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      s.bl_tree[curlen * 2]/*.Freq*/ += count;

    } else if (curlen !== 0) {

      if (curlen !== prevlen) { s.bl_tree[curlen * 2]/*.Freq*/++; }
      s.bl_tree[REP_3_6 * 2]/*.Freq*/++;

    } else if (count <= 10) {
      s.bl_tree[REPZ_3_10 * 2]/*.Freq*/++;

    } else {
      s.bl_tree[REPZ_11_138 * 2]/*.Freq*/++;
    }

    count = 0;
    prevlen = curlen;

    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
};


/* ===========================================================================
 * Send a literal or distance tree in compressed form, using the codes in
 * bl_tree.
 */
const send_tree = (s, tree, max_code) => {
//    deflate_state *s;
//    ct_data *tree; /* the tree to be scanned */
//    int max_code;       /* and its largest code of non zero frequency */

  let n;                     /* iterates over all tree elements */
  let prevlen = -1;          /* last emitted length */
  let curlen;                /* length of current code */

  let nextlen = tree[0 * 2 + 1]/*.Len*/; /* length of next code */

  let count = 0;             /* repeat count of the current code */
  let max_count = 7;         /* max repeat count */
  let min_count = 4;         /* min repeat count */

  /* tree[max_code+1].Len = -1; */  /* guard already set */
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      do { send_code(s, curlen, s.bl_tree); } while (--count !== 0);

    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        send_code(s, curlen, s.bl_tree);
        count--;
      }
      //Assert(count >= 3 && count <= 6, " 3_6?");
      send_code(s, REP_3_6, s.bl_tree);
      send_bits(s, count - 3, 2);

    } else if (count <= 10) {
      send_code(s, REPZ_3_10, s.bl_tree);
      send_bits(s, count - 3, 3);

    } else {
      send_code(s, REPZ_11_138, s.bl_tree);
      send_bits(s, count - 11, 7);
    }

    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
};


/* ===========================================================================
 * Construct the Huffman tree for the bit lengths and return the index in
 * bl_order of the last bit length code to send.
 */
const build_bl_tree = (s) => {

  let max_blindex;  /* index of last bit length code of non zero freq */

  /* Determine the bit length frequencies for literal and distance trees */
  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);

  /* Build the bit length tree: */
  build_tree(s, s.bl_desc);
  /* opt_len now includes the length of the tree representations, except
   * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
   */

  /* Determine the number of bit length codes to send. The pkzip format
   * requires that at least 4 bit length codes be sent. (appnote.txt says
   * 3 but the actual value used is 4.)
   */
  for (max_blindex = BL_CODES$1 - 1; max_blindex >= 3; max_blindex--) {
    if (s.bl_tree[bl_order[max_blindex] * 2 + 1]/*.Len*/ !== 0) {
      break;
    }
  }
  /* Update opt_len to include the bit length tree and counts */
  s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
  //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
  //        s->opt_len, s->static_len));

  return max_blindex;
};


/* ===========================================================================
 * Send the header for a block using dynamic Huffman trees: the counts, the
 * lengths of the bit length codes, the literal tree and the distance tree.
 * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
 */
const send_all_trees = (s, lcodes, dcodes, blcodes) => {
//    deflate_state *s;
//    int lcodes, dcodes, blcodes; /* number of codes for each tree */

  let rank;                    /* index in bl_order */

  //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
  //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
  //        "too many codes");
  //Tracev((stderr, "\nbl counts: "));
  send_bits(s, lcodes - 257, 5); /* not +255 as stated in appnote.txt */
  send_bits(s, dcodes - 1,   5);
  send_bits(s, blcodes - 4,  4); /* not -3 as stated in appnote.txt */
  for (rank = 0; rank < blcodes; rank++) {
    //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
    send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1]/*.Len*/, 3);
  }
  //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_ltree, lcodes - 1); /* literal tree */
  //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_dtree, dcodes - 1); /* distance tree */
  //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
};


/* ===========================================================================
 * Check if the data type is TEXT or BINARY, using the following algorithm:
 * - TEXT if the two conditions below are satisfied:
 *    a) There are no non-portable control characters belonging to the
 *       "block list" (0..6, 14..25, 28..31).
 *    b) There is at least one printable character belonging to the
 *       "allow list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
 * - BINARY otherwise.
 * - The following partially-portable control characters form a
 *   "gray list" that is ignored in this detection algorithm:
 *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
 * IN assertion: the fields Freq of dyn_ltree are set.
 */
const detect_data_type = (s) => {
  /* block_mask is the bit mask of block-listed bytes
   * set bits 0..6, 14..25, and 28..31
   * 0xf3ffc07f = binary 11110011111111111100000001111111
   */
  let block_mask = 0xf3ffc07f;
  let n;

  /* Check for non-textual ("block-listed") bytes. */
  for (n = 0; n <= 31; n++, block_mask >>>= 1) {
    if ((block_mask & 1) && (s.dyn_ltree[n * 2]/*.Freq*/ !== 0)) {
      return Z_BINARY;
    }
  }

  /* Check for textual ("allow-listed") bytes. */
  if (s.dyn_ltree[9 * 2]/*.Freq*/ !== 0 || s.dyn_ltree[10 * 2]/*.Freq*/ !== 0 ||
      s.dyn_ltree[13 * 2]/*.Freq*/ !== 0) {
    return Z_TEXT;
  }
  for (n = 32; n < LITERALS$1; n++) {
    if (s.dyn_ltree[n * 2]/*.Freq*/ !== 0) {
      return Z_TEXT;
    }
  }

  /* There are no "block-listed" or "allow-listed" bytes:
   * this stream either is empty or has tolerated ("gray-listed") bytes only.
   */
  return Z_BINARY;
};


let static_init_done = false;

/* ===========================================================================
 * Initialize the tree data structures for a new zlib stream.
 */
const _tr_init$1 = (s) =>
{

  if (!static_init_done) {
    tr_static_init();
    static_init_done = true;
  }

  s.l_desc  = new TreeDesc(s.dyn_ltree, static_l_desc);
  s.d_desc  = new TreeDesc(s.dyn_dtree, static_d_desc);
  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);

  s.bi_buf = 0;
  s.bi_valid = 0;

  /* Initialize the first block of the first file: */
  init_block(s);
};


/* ===========================================================================
 * Send a stored block
 */
const _tr_stored_block$1 = (s, buf, stored_len, last) => {
//DeflateState *s;
//charf *buf;       /* input block */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */

  send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);    /* send block type */
  bi_windup(s);        /* align on byte boundary */
  put_short(s, stored_len);
  put_short(s, ~stored_len);
  if (stored_len) {
    s.pending_buf.set(s.window.subarray(buf, buf + stored_len), s.pending);
  }
  s.pending += stored_len;
};


/* ===========================================================================
 * Send one empty static block to give enough lookahead for inflate.
 * This takes 10 bits, of which 7 may remain in the bit buffer.
 */
const _tr_align$1 = (s) => {
  send_bits(s, STATIC_TREES << 1, 3);
  send_code(s, END_BLOCK, static_ltree);
  bi_flush(s);
};


/* ===========================================================================
 * Determine the best encoding for the current block: dynamic trees, static
 * trees or store, and write out the encoded block.
 */
const _tr_flush_block$1 = (s, buf, stored_len, last) => {
//DeflateState *s;
//charf *buf;       /* input block, or NULL if too old */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */

  let opt_lenb, static_lenb;  /* opt_len and static_len in bytes */
  let max_blindex = 0;        /* index of last bit length code of non zero freq */

  /* Build the Huffman trees unless a stored block is forced */
  if (s.level > 0) {

    /* Check if the file is binary or text */
    if (s.strm.data_type === Z_UNKNOWN$1) {
      s.strm.data_type = detect_data_type(s);
    }

    /* Construct the literal and distance trees */
    build_tree(s, s.l_desc);
    // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));

    build_tree(s, s.d_desc);
    // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));
    /* At this point, opt_len and static_len are the total bit lengths of
     * the compressed block data, excluding the tree representations.
     */

    /* Build the bit length tree for the above two trees, and get the index
     * in bl_order of the last bit length code to send.
     */
    max_blindex = build_bl_tree(s);

    /* Determine the best encoding. Compute the block lengths in bytes. */
    opt_lenb = (s.opt_len + 3 + 7) >>> 3;
    static_lenb = (s.static_len + 3 + 7) >>> 3;

    // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
    //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
    //        s->sym_next / 3));

    if (static_lenb <= opt_lenb) { opt_lenb = static_lenb; }

  } else {
    // Assert(buf != (char*)0, "lost buf");
    opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
  }

  if ((stored_len + 4 <= opt_lenb) && (buf !== -1)) {
    /* 4: two words for the lengths */

    /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
     * Otherwise we can't have processed more than WSIZE input bytes since
     * the last block flush, because compression would have been
     * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
     * transform a block into a stored block.
     */
    _tr_stored_block$1(s, buf, stored_len, last);

  } else if (s.strategy === Z_FIXED$1 || static_lenb === opt_lenb) {

    send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);

  } else {
    send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
    send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
  /* The above check is made mod 2^32, for files larger than 512 MB
   * and uLong implemented on 32 bits.
   */
  init_block(s);

  if (last) {
    bi_windup(s);
  }
  // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
  //       s->compressed_len-7*last));
};

/* ===========================================================================
 * Save the match info and tally the frequency counts. Return true if
 * the current block must be flushed.
 */
const _tr_tally$1 = (s, dist, lc) => {
//    deflate_state *s;
//    unsigned dist;  /* distance of matched string */
//    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */

  s.pending_buf[s.sym_buf + s.sym_next++] = dist;
  s.pending_buf[s.sym_buf + s.sym_next++] = dist >> 8;
  s.pending_buf[s.sym_buf + s.sym_next++] = lc;
  if (dist === 0) {
    /* lc is the unmatched char */
    s.dyn_ltree[lc * 2]/*.Freq*/++;
  } else {
    s.matches++;
    /* Here, lc is the match length - MIN_MATCH */
    dist--;             /* dist = match distance - 1 */
    //Assert((ush)dist < (ush)MAX_DIST(s) &&
    //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
    //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

    s.dyn_ltree[(_length_code[lc] + LITERALS$1 + 1) * 2]/*.Freq*/++;
    s.dyn_dtree[d_code(dist) * 2]/*.Freq*/++;
  }

  return (s.sym_next === s.sym_end);
};

var _tr_init_1  = _tr_init$1;
var _tr_stored_block_1 = _tr_stored_block$1;
var _tr_flush_block_1  = _tr_flush_block$1;
var _tr_tally_1 = _tr_tally$1;
var _tr_align_1 = _tr_align$1;

var trees = {
	_tr_init: _tr_init_1,
	_tr_stored_block: _tr_stored_block_1,
	_tr_flush_block: _tr_flush_block_1,
	_tr_tally: _tr_tally_1,
	_tr_align: _tr_align_1
};

// Note: adler32 takes 12% for level 0 and 2% for level 6.
// It isn't worth it to make additional optimizations as in original.
// Small size is preferable.

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

const adler32 = (adler, buf, len, pos) => {
  let s1 = (adler & 0xffff) |0,
      s2 = ((adler >>> 16) & 0xffff) |0,
      n = 0;

  while (len !== 0) {
    // Set limit ~ twice less than 5552, to keep
    // s2 in 31-bits, because we force signed ints.
    // in other case %= will fail.
    n = len > 2000 ? 2000 : len;
    len -= n;

    do {
      s1 = (s1 + buf[pos++]) |0;
      s2 = (s2 + s1) |0;
    } while (--n);

    s1 %= 65521;
    s2 %= 65521;
  }

  return (s1 | (s2 << 16)) |0;
};


var adler32_1 = adler32;

// Note: we can't get significant speed boost here.
// So write code to minimize size - no pregenerated tables
// and array tools dependencies.

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

// Use ordinary array, since untyped makes no boost here
const makeTable = () => {
  let c, table = [];

  for (var n = 0; n < 256; n++) {
    c = n;
    for (var k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }

  return table;
};

// Create table on load. Just 255 signed longs. Not a problem.
const crcTable = new Uint32Array(makeTable());


const crc32 = (crc, buf, len, pos) => {
  const t = crcTable;
  const end = pos + len;

  crc ^= -1;

  for (let i = pos; i < end; i++) {
    crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  }

  return (crc ^ (-1)); // >>> 0;
};


var crc32_1 = crc32;

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

var messages = {
  2:      'need dictionary',     /* Z_NEED_DICT       2  */
  1:      'stream end',          /* Z_STREAM_END      1  */
  0:      '',                    /* Z_OK              0  */
  '-1':   'file error',          /* Z_ERRNO         (-1) */
  '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
  '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
  '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
  '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
  '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
};

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

var constants$2 = {

  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH:         0,
  Z_PARTIAL_FLUSH:    1,
  Z_SYNC_FLUSH:       2,
  Z_FULL_FLUSH:       3,
  Z_FINISH:           4,
  Z_BLOCK:            5,
  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK:               0,
  Z_STREAM_END:       1,
  Z_STREAM_ERROR:    -2,
  Z_DATA_ERROR:      -3,
  Z_BUF_ERROR:       -5,
  Z_DEFAULT_COMPRESSION:   -1,


  Z_FILTERED:               1,
  Z_HUFFMAN_ONLY:           2,
  Z_RLE:                    3,
  Z_FIXED:                  4,
  Z_DEFAULT_STRATEGY:       0,

  //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN:                2,

  /* The deflate compression method */
  Z_DEFLATED:               8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

const { _tr_init, _tr_stored_block, _tr_flush_block, _tr_tally, _tr_align } = trees;




/* Public constants ==========================================================*/
/* ===========================================================================*/

const {
  Z_NO_FLUSH: Z_NO_FLUSH$2, Z_PARTIAL_FLUSH, Z_FULL_FLUSH: Z_FULL_FLUSH$1, Z_FINISH: Z_FINISH$3, Z_BLOCK: Z_BLOCK$1,
  Z_OK: Z_OK$3, Z_STREAM_END: Z_STREAM_END$3, Z_STREAM_ERROR: Z_STREAM_ERROR$2, Z_DATA_ERROR: Z_DATA_ERROR$2, Z_BUF_ERROR: Z_BUF_ERROR$1,
  Z_DEFAULT_COMPRESSION: Z_DEFAULT_COMPRESSION$1,
  Z_FILTERED, Z_HUFFMAN_ONLY, Z_RLE, Z_FIXED, Z_DEFAULT_STRATEGY: Z_DEFAULT_STRATEGY$1,
  Z_UNKNOWN,
  Z_DEFLATED: Z_DEFLATED$2
} = constants$2;

/*============================================================================*/


const MAX_MEM_LEVEL = 9;
/* Maximum value for memLevel in deflateInit2 */
const MAX_WBITS$1 = 15;
/* 32K LZ77 window */
const DEF_MEM_LEVEL = 8;


const LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */
const LITERALS      = 256;
/* number of literal bytes 0..255 */
const L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */
const D_CODES       = 30;
/* number of distance codes */
const BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */
const HEAP_SIZE     = 2 * L_CODES + 1;
/* maximum heap size */
const MAX_BITS  = 15;
/* All codes must not exceed MAX_BITS bits */

const MIN_MATCH = 3;
const MAX_MATCH = 258;
const MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

const PRESET_DICT = 0x20;

const INIT_STATE    =  42;    /* zlib header -> BUSY_STATE */
//#ifdef GZIP
const GZIP_STATE    =  57;    /* gzip header -> BUSY_STATE | EXTRA_STATE */
//#endif
const EXTRA_STATE   =  69;    /* gzip extra block -> NAME_STATE */
const NAME_STATE    =  73;    /* gzip file name -> COMMENT_STATE */
const COMMENT_STATE =  91;    /* gzip comment -> HCRC_STATE */
const HCRC_STATE    = 103;    /* gzip header CRC -> BUSY_STATE */
const BUSY_STATE    = 113;    /* deflate -> FINISH_STATE */
const FINISH_STATE  = 666;    /* stream complete */

const BS_NEED_MORE      = 1; /* block not completed, need more input or more output */
const BS_BLOCK_DONE     = 2; /* block flush performed */
const BS_FINISH_STARTED = 3; /* finish started, need only more output at next deflate */
const BS_FINISH_DONE    = 4; /* finish done, accept no more input or output */

const OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

const err = (strm, errorCode) => {
  strm.msg = messages[errorCode];
  return errorCode;
};

const rank = (f) => {
  return ((f) * 2) - ((f) > 4 ? 9 : 0);
};

const zero = (buf) => {
  let len = buf.length; while (--len >= 0) { buf[len] = 0; }
};

/* ===========================================================================
 * Slide the hash table when sliding the window down (could be avoided with 32
 * bit values at the expense of memory usage). We slide even when level == 0 to
 * keep the hash table consistent if we switch back to level > 0 later.
 */
const slide_hash = (s) => {
  let n, m;
  let p;
  let wsize = s.w_size;

  n = s.hash_size;
  p = n;
  do {
    m = s.head[--p];
    s.head[p] = (m >= wsize ? m - wsize : 0);
  } while (--n);
  n = wsize;
//#ifndef FASTEST
  p = n;
  do {
    m = s.prev[--p];
    s.prev[p] = (m >= wsize ? m - wsize : 0);
    /* If n is not on any hash chain, prev[n] is garbage but
     * its value will never be used.
     */
  } while (--n);
//#endif
};

/* eslint-disable new-cap */
let HASH_ZLIB = (s, prev, data) => ((prev << s.hash_shift) ^ data) & s.hash_mask;
// This hash causes less collisions, https://github.com/nodeca/pako/issues/135
// But breaks binary compatibility
//let HASH_FAST = (s, prev, data) => ((prev << 8) + (prev >> 8) + (data << 4)) & s.hash_mask;
let HASH = HASH_ZLIB;


/* =========================================================================
 * Flush as much pending output as possible. All deflate() output, except for
 * some deflate_stored() output, goes through this function so some
 * applications may wish to modify it to avoid allocating a large
 * strm->next_out buffer and copying into it. (See also read_buf()).
 */
const flush_pending = (strm) => {
  const s = strm.state;

  //_tr_flush_bits(s);
  let len = s.pending;
  if (len > strm.avail_out) {
    len = strm.avail_out;
  }
  if (len === 0) { return; }

  strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
  strm.next_out  += len;
  s.pending_out  += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending      -= len;
  if (s.pending === 0) {
    s.pending_out = 0;
  }
};


const flush_block_only = (s, last) => {
  _tr_flush_block(s, (s.block_start >= 0 ? s.block_start : -1), s.strstart - s.block_start, last);
  s.block_start = s.strstart;
  flush_pending(s.strm);
};


const put_byte = (s, b) => {
  s.pending_buf[s.pending++] = b;
};


/* =========================================================================
 * Put a short in the pending buffer. The 16-bit value is put in MSB order.
 * IN assertion: the stream state is correct and there is enough room in
 * pending_buf.
 */
const putShortMSB = (s, b) => {

  //  put_byte(s, (Byte)(b >> 8));
//  put_byte(s, (Byte)(b & 0xff));
  s.pending_buf[s.pending++] = (b >>> 8) & 0xff;
  s.pending_buf[s.pending++] = b & 0xff;
};


/* ===========================================================================
 * Read a new buffer from the current input stream, update the adler32
 * and total number of bytes read.  All deflate() input goes through
 * this function so some applications may wish to modify it to avoid
 * allocating a large strm->input buffer and copying from it.
 * (See also flush_pending()).
 */
const read_buf = (strm, buf, start, size) => {

  let len = strm.avail_in;

  if (len > size) { len = size; }
  if (len === 0) { return 0; }

  strm.avail_in -= len;

  // zmemcpy(buf, strm->next_in, len);
  buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
  if (strm.state.wrap === 1) {
    strm.adler = adler32_1(strm.adler, buf, len, start);
  }

  else if (strm.state.wrap === 2) {
    strm.adler = crc32_1(strm.adler, buf, len, start);
  }

  strm.next_in += len;
  strm.total_in += len;

  return len;
};


/* ===========================================================================
 * Set match_start to the longest match starting at the given string and
 * return its length. Matches shorter or equal to prev_length are discarded,
 * in which case the result is equal to prev_length and match_start is
 * garbage.
 * IN assertions: cur_match is the head of the hash chain for the current
 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
 * OUT assertion: the match length is not greater than s->lookahead.
 */
const longest_match = (s, cur_match) => {

  let chain_length = s.max_chain_length;      /* max hash chain length */
  let scan = s.strstart; /* current string */
  let match;                       /* matched string */
  let len;                           /* length of current match */
  let best_len = s.prev_length;              /* best match length so far */
  let nice_match = s.nice_match;             /* stop if match long enough */
  const limit = (s.strstart > (s.w_size - MIN_LOOKAHEAD)) ?
      s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0/*NIL*/;

  const _win = s.window; // shortcut

  const wmask = s.w_mask;
  const prev  = s.prev;

  /* Stop when cur_match becomes <= limit. To simplify the code,
   * we prevent matches with the string of window index 0.
   */

  const strend = s.strstart + MAX_MATCH;
  let scan_end1  = _win[scan + best_len - 1];
  let scan_end   = _win[scan + best_len];

  /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
   * It is easy to get rid of this optimization if necessary.
   */
  // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

  /* Do not waste too much time if we already have a good match: */
  if (s.prev_length >= s.good_match) {
    chain_length >>= 2;
  }
  /* Do not look for matches beyond the end of the input. This is necessary
   * to make deflate deterministic.
   */
  if (nice_match > s.lookahead) { nice_match = s.lookahead; }

  // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");

  do {
    // Assert(cur_match < s->strstart, "no future");
    match = cur_match;

    /* Skip to next match if the match length cannot increase
     * or if the match length is less than 2.  Note that the checks below
     * for insufficient lookahead only occur occasionally for performance
     * reasons.  Therefore uninitialized memory will be accessed, and
     * conditional jumps will be made that depend on those values.
     * However the length of the match is limited to the lookahead, so
     * the output of deflate is not affected by the uninitialized values.
     */

    if (_win[match + best_len]     !== scan_end  ||
        _win[match + best_len - 1] !== scan_end1 ||
        _win[match]                !== _win[scan] ||
        _win[++match]              !== _win[scan + 1]) {
      continue;
    }

    /* The check at best_len-1 can be removed because it will be made
     * again later. (This heuristic is not always a win.)
     * It is not necessary to compare scan[2] and match[2] since they
     * are always equal when the other bytes match, given that
     * the hash keys are equal and that HASH_BITS >= 8.
     */
    scan += 2;
    match++;
    // Assert(*scan == *match, "match[2]?");

    /* We check for insufficient lookahead only every 8th comparison;
     * the 256th check will be made at strstart+258.
     */
    do {
      /*jshint noempty:false*/
    } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             scan < strend);

    // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");

    len = MAX_MATCH - (strend - scan);
    scan = strend - MAX_MATCH;

    if (len > best_len) {
      s.match_start = cur_match;
      best_len = len;
      if (len >= nice_match) {
        break;
      }
      scan_end1  = _win[scan + best_len - 1];
      scan_end   = _win[scan + best_len];
    }
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

  if (best_len <= s.lookahead) {
    return best_len;
  }
  return s.lookahead;
};


/* ===========================================================================
 * Fill the window when the lookahead becomes insufficient.
 * Updates strstart and lookahead.
 *
 * IN assertion: lookahead < MIN_LOOKAHEAD
 * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
 *    At least one byte has been read, or avail_in == 0; reads are
 *    performed for at least two bytes (required for the zip translate_eol
 *    option -- not supported here).
 */
const fill_window = (s) => {

  const _w_size = s.w_size;
  let n, more, str;

  //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

  do {
    more = s.window_size - s.lookahead - s.strstart;

    // JS ints have 32 bit, block below not needed
    /* Deal with !@#$% 64K limit: */
    //if (sizeof(int) <= 2) {
    //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
    //        more = wsize;
    //
    //  } else if (more == (unsigned)(-1)) {
    //        /* Very unlikely, but possible on 16 bit machine if
    //         * strstart == 0 && lookahead == 1 (input done a byte at time)
    //         */
    //        more--;
    //    }
    //}


    /* If the window is almost full and there is insufficient lookahead,
     * move the upper half to the lower one to make room in the upper half.
     */
    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {

      s.window.set(s.window.subarray(_w_size, _w_size + _w_size - more), 0);
      s.match_start -= _w_size;
      s.strstart -= _w_size;
      /* we now have strstart >= MAX_DIST */
      s.block_start -= _w_size;
      if (s.insert > s.strstart) {
        s.insert = s.strstart;
      }
      slide_hash(s);
      more += _w_size;
    }
    if (s.strm.avail_in === 0) {
      break;
    }

    /* If there was no sliding:
     *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
     *    more == window_size - lookahead - strstart
     * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
     * => more >= window_size - 2*WSIZE + 2
     * In the BIG_MEM or MMAP case (not yet supported),
     *   window_size == input_size + MIN_LOOKAHEAD  &&
     *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
     * Otherwise, window_size == 2*WSIZE so more >= 2.
     * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
     */
    //Assert(more >= 2, "more < 2");
    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
    s.lookahead += n;

    /* Initialize the hash value now that we have some input: */
    if (s.lookahead + s.insert >= MIN_MATCH) {
      str = s.strstart - s.insert;
      s.ins_h = s.window[str];

      /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */
      s.ins_h = HASH(s, s.ins_h, s.window[str + 1]);
//#if MIN_MATCH != 3
//        Call update_hash() MIN_MATCH-3 more times
//#endif
      while (s.insert) {
        /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
        s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);

        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
        s.insert--;
        if (s.lookahead + s.insert < MIN_MATCH) {
          break;
        }
      }
    }
    /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
     * but this is not important since only literal bytes will be emitted.
     */

  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);

  /* If the WIN_INIT bytes after the end of the current data have never been
   * written, then zero those bytes in order to avoid memory check reports of
   * the use of uninitialized (or uninitialised as Julian writes) bytes by
   * the longest match routines.  Update the high water mark for the next
   * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
   * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
   */
//  if (s.high_water < s.window_size) {
//    const curr = s.strstart + s.lookahead;
//    let init = 0;
//
//    if (s.high_water < curr) {
//      /* Previous high water mark below current data -- zero WIN_INIT
//       * bytes or up to end of window, whichever is less.
//       */
//      init = s.window_size - curr;
//      if (init > WIN_INIT)
//        init = WIN_INIT;
//      zmemzero(s->window + curr, (unsigned)init);
//      s->high_water = curr + init;
//    }
//    else if (s->high_water < (ulg)curr + WIN_INIT) {
//      /* High water mark at or above current data, but below current data
//       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
//       * to end of window, whichever is less.
//       */
//      init = (ulg)curr + WIN_INIT - s->high_water;
//      if (init > s->window_size - s->high_water)
//        init = s->window_size - s->high_water;
//      zmemzero(s->window + s->high_water, (unsigned)init);
//      s->high_water += init;
//    }
//  }
//
//  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
//    "not enough room for search");
};

/* ===========================================================================
 * Copy without compression as much as possible from the input stream, return
 * the current block state.
 *
 * In case deflateParams() is used to later switch to a non-zero compression
 * level, s->matches (otherwise unused when storing) keeps track of the number
 * of hash table slides to perform. If s->matches is 1, then one hash table
 * slide will be done when switching. If s->matches is 2, the maximum value
 * allowed here, then the hash table will be cleared, since two or more slides
 * is the same as a clear.
 *
 * deflate_stored() is written to minimize the number of times an input byte is
 * copied. It is most efficient with large input and output buffers, which
 * maximizes the opportunites to have a single copy from next_in to next_out.
 */
const deflate_stored = (s, flush) => {

  /* Smallest worthy block size when not flushing or finishing. By default
   * this is 32K. This can be as small as 507 bytes for memLevel == 1. For
   * large input and output buffers, the stored block size will be larger.
   */
  let min_block = s.pending_buf_size - 5 > s.w_size ? s.w_size : s.pending_buf_size - 5;

  /* Copy as many min_block or larger stored blocks directly to next_out as
   * possible. If flushing, copy the remaining available input to next_out as
   * stored blocks, if there is enough space.
   */
  let len, left, have, last = 0;
  let used = s.strm.avail_in;
  do {
    /* Set len to the maximum size block that we can copy directly with the
     * available input data and output space. Set left to how much of that
     * would be copied from what's left in the window.
     */
    len = 65535/* MAX_STORED */;     /* maximum deflate stored block length */
    have = (s.bi_valid + 42) >> 3;     /* number of header bytes */
    if (s.strm.avail_out < have) {         /* need room for header */
      break;
    }
      /* maximum stored block length that will fit in avail_out: */
    have = s.strm.avail_out - have;
    left = s.strstart - s.block_start;  /* bytes left in window */
    if (len > left + s.strm.avail_in) {
      len = left + s.strm.avail_in;   /* limit len to the input */
    }
    if (len > have) {
      len = have;             /* limit len to the output */
    }

    /* If the stored block would be less than min_block in length, or if
     * unable to copy all of the available input when flushing, then try
     * copying to the window and the pending buffer instead. Also don't
     * write an empty block when flushing -- deflate() does that.
     */
    if (len < min_block && ((len === 0 && flush !== Z_FINISH$3) ||
                        flush === Z_NO_FLUSH$2 ||
                        len !== left + s.strm.avail_in)) {
      break;
    }

    /* Make a dummy stored block in pending to get the header bytes,
     * including any pending bits. This also updates the debugging counts.
     */
    last = flush === Z_FINISH$3 && len === left + s.strm.avail_in ? 1 : 0;
    _tr_stored_block(s, 0, 0, last);

    /* Replace the lengths in the dummy stored block with len. */
    s.pending_buf[s.pending - 4] = len;
    s.pending_buf[s.pending - 3] = len >> 8;
    s.pending_buf[s.pending - 2] = ~len;
    s.pending_buf[s.pending - 1] = ~len >> 8;

    /* Write the stored block header bytes. */
    flush_pending(s.strm);

//#ifdef ZLIB_DEBUG
//    /* Update debugging counts for the data about to be copied. */
//    s->compressed_len += len << 3;
//    s->bits_sent += len << 3;
//#endif

    /* Copy uncompressed bytes from the window to next_out. */
    if (left) {
      if (left > len) {
        left = len;
      }
      //zmemcpy(s->strm->next_out, s->window + s->block_start, left);
      s.strm.output.set(s.window.subarray(s.block_start, s.block_start + left), s.strm.next_out);
      s.strm.next_out += left;
      s.strm.avail_out -= left;
      s.strm.total_out += left;
      s.block_start += left;
      len -= left;
    }

    /* Copy uncompressed bytes directly from next_in to next_out, updating
     * the check value.
     */
    if (len) {
      read_buf(s.strm, s.strm.output, s.strm.next_out, len);
      s.strm.next_out += len;
      s.strm.avail_out -= len;
      s.strm.total_out += len;
    }
  } while (last === 0);

  /* Update the sliding window with the last s->w_size bytes of the copied
   * data, or append all of the copied data to the existing window if less
   * than s->w_size bytes were copied. Also update the number of bytes to
   * insert in the hash tables, in the event that deflateParams() switches to
   * a non-zero compression level.
   */
  used -= s.strm.avail_in;    /* number of input bytes directly copied */
  if (used) {
    /* If any input was used, then no unused input remains in the window,
     * therefore s->block_start == s->strstart.
     */
    if (used >= s.w_size) {  /* supplant the previous history */
      s.matches = 2;     /* clear hash */
      //zmemcpy(s->window, s->strm->next_in - s->w_size, s->w_size);
      s.window.set(s.strm.input.subarray(s.strm.next_in - s.w_size, s.strm.next_in), 0);
      s.strstart = s.w_size;
      s.insert = s.strstart;
    }
    else {
      if (s.window_size - s.strstart <= used) {
        /* Slide the window down. */
        s.strstart -= s.w_size;
        //zmemcpy(s->window, s->window + s->w_size, s->strstart);
        s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
        if (s.matches < 2) {
          s.matches++;   /* add a pending slide_hash() */
        }
        if (s.insert > s.strstart) {
          s.insert = s.strstart;
        }
      }
      //zmemcpy(s->window + s->strstart, s->strm->next_in - used, used);
      s.window.set(s.strm.input.subarray(s.strm.next_in - used, s.strm.next_in), s.strstart);
      s.strstart += used;
      s.insert += used > s.w_size - s.insert ? s.w_size - s.insert : used;
    }
    s.block_start = s.strstart;
  }
  if (s.high_water < s.strstart) {
    s.high_water = s.strstart;
  }

  /* If the last block was written to next_out, then done. */
  if (last) {
    return BS_FINISH_DONE;
  }

  /* If flushing and all input has been consumed, then done. */
  if (flush !== Z_NO_FLUSH$2 && flush !== Z_FINISH$3 &&
    s.strm.avail_in === 0 && s.strstart === s.block_start) {
    return BS_BLOCK_DONE;
  }

  /* Fill the window with any remaining input. */
  have = s.window_size - s.strstart;
  if (s.strm.avail_in > have && s.block_start >= s.w_size) {
    /* Slide the window down. */
    s.block_start -= s.w_size;
    s.strstart -= s.w_size;
    //zmemcpy(s->window, s->window + s->w_size, s->strstart);
    s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
    if (s.matches < 2) {
      s.matches++;       /* add a pending slide_hash() */
    }
    have += s.w_size;      /* more space now */
    if (s.insert > s.strstart) {
      s.insert = s.strstart;
    }
  }
  if (have > s.strm.avail_in) {
    have = s.strm.avail_in;
  }
  if (have) {
    read_buf(s.strm, s.window, s.strstart, have);
    s.strstart += have;
    s.insert += have > s.w_size - s.insert ? s.w_size - s.insert : have;
  }
  if (s.high_water < s.strstart) {
    s.high_water = s.strstart;
  }

  /* There was not enough avail_out to write a complete worthy or flushed
   * stored block to next_out. Write a stored block to pending instead, if we
   * have enough input for a worthy block, or if flushing and there is enough
   * room for the remaining input as a stored block in the pending buffer.
   */
  have = (s.bi_valid + 42) >> 3;     /* number of header bytes */
    /* maximum stored block length that will fit in pending: */
  have = s.pending_buf_size - have > 65535/* MAX_STORED */ ? 65535/* MAX_STORED */ : s.pending_buf_size - have;
  min_block = have > s.w_size ? s.w_size : have;
  left = s.strstart - s.block_start;
  if (left >= min_block ||
     ((left || flush === Z_FINISH$3) && flush !== Z_NO_FLUSH$2 &&
     s.strm.avail_in === 0 && left <= have)) {
    len = left > have ? have : left;
    last = flush === Z_FINISH$3 && s.strm.avail_in === 0 &&
         len === left ? 1 : 0;
    _tr_stored_block(s, s.block_start, len, last);
    s.block_start += len;
    flush_pending(s.strm);
  }

  /* We've done all we can with the available input and output. */
  return last ? BS_FINISH_STARTED : BS_NEED_MORE;
};


/* ===========================================================================
 * Compress as much as possible from the input stream, return the current
 * block state.
 * This function does not perform lazy evaluation of matches and inserts
 * new strings in the dictionary only for unmatched strings or for short
 * matches. It is used only for the fast compression options.
 */
const deflate_fast = (s, flush) => {

  let hash_head;        /* head of the hash chain */
  let bflush;           /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break; /* flush the current block */
      }
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     * At this point we have always match_length < MIN_MATCH
     */
    if (hash_head !== 0/*NIL*/ && ((s.strstart - hash_head) <= (s.w_size - MIN_LOOKAHEAD))) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */
    }
    if (s.match_length >= MIN_MATCH) {
      // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

      /*** _tr_tally_dist(s, s.strstart - s.match_start,
                     s.match_length - MIN_MATCH, bflush); ***/
      bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;

      /* Insert new strings in the hash table only if the match length
       * is not too large. This saves time but degrades compression.
       */
      if (s.match_length <= s.max_lazy_match/*max_insert_length*/ && s.lookahead >= MIN_MATCH) {
        s.match_length--; /* string at strstart already in table */
        do {
          s.strstart++;
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
          /* strstart never exceeds WSIZE-MAX_MATCH, so there are
           * always MIN_MATCH bytes ahead.
           */
        } while (--s.match_length !== 0);
        s.strstart++;
      } else
      {
        s.strstart += s.match_length;
        s.match_length = 0;
        s.ins_h = s.window[s.strstart];
        /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */
        s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]);

//#if MIN_MATCH != 3
//                Call UPDATE_HASH() MIN_MATCH-3 more times
//#endif
        /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
         * matter since it will be recomputed at next deflate call.
         */
      }
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s.window[s.strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = _tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = ((s.strstart < (MIN_MATCH - 1)) ? s.strstart : MIN_MATCH - 1);
  if (flush === Z_FINISH$3) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
};

/* ===========================================================================
 * Same as above, but achieves better compression. We use a lazy
 * evaluation for matches: a match is finally adopted only if there is
 * no better match at the next window position.
 */
const deflate_slow = (s, flush) => {

  let hash_head;          /* head of hash chain */
  let bflush;              /* set if current block must be flushed */

  let max_insert;

  /* Process the input block. */
  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     */
    s.prev_length = s.match_length;
    s.prev_match = s.match_start;
    s.match_length = MIN_MATCH - 1;

    if (hash_head !== 0/*NIL*/ && s.prev_length < s.max_lazy_match &&
        s.strstart - hash_head <= (s.w_size - MIN_LOOKAHEAD)/*MAX_DIST(s)*/) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */

      if (s.match_length <= 5 &&
         (s.strategy === Z_FILTERED || (s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096/*TOO_FAR*/))) {

        /* If prev_match is also MIN_MATCH, match_start is garbage
         * but we will ignore the current match anyway.
         */
        s.match_length = MIN_MATCH - 1;
      }
    }
    /* If there was a match at the previous step and the current
     * match is not better, output the previous match:
     */
    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - MIN_MATCH;
      /* Do not insert strings in hash table beyond this. */

      //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

      /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                     s.prev_length - MIN_MATCH, bflush);***/
      bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
      /* Insert in hash table all strings up to the end of the match.
       * strstart-1 and strstart are already inserted. If there is not
       * enough lookahead, the last two strings are not inserted in
       * the hash table.
       */
      s.lookahead -= s.prev_length - 1;
      s.prev_length -= 2;
      do {
        if (++s.strstart <= max_insert) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }
      } while (--s.prev_length !== 0);
      s.match_available = 0;
      s.match_length = MIN_MATCH - 1;
      s.strstart++;

      if (bflush) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }

    } else if (s.match_available) {
      /* If there was no match at the previous position, output a
       * single literal. If there was a match but the current match
       * is longer, truncate the previous match to a single literal.
       */
      //Tracevv((stderr,"%c", s->window[s->strstart-1]));
      /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
      bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);

      if (bflush) {
        /*** FLUSH_BLOCK_ONLY(s, 0) ***/
        flush_block_only(s, false);
        /***/
      }
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    } else {
      /* There is no previous match to compare with, wait for
       * the next step to decide.
       */
      s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }
  //Assert (flush != Z_NO_FLUSH, "no flush?");
  if (s.match_available) {
    //Tracevv((stderr,"%c", s->window[s->strstart-1]));
    /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
    bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);

    s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
  if (flush === Z_FINISH$3) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_BLOCK_DONE;
};


/* ===========================================================================
 * For Z_RLE, simply look for runs of bytes, generate matches only of distance
 * one.  Do not maintain a hash table.  (It will be regenerated if this run of
 * deflate switches away from Z_RLE.)
 */
const deflate_rle = (s, flush) => {

  let bflush;            /* set if current block must be flushed */
  let prev;              /* byte at distance one to match */
  let scan, strend;      /* scan goes up to strend for length of run */

  const _win = s.window;

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the longest run, plus one for the unrolled loop.
     */
    if (s.lookahead <= MAX_MATCH) {
      fill_window(s);
      if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* See how many times the previous byte repeats */
    s.match_length = 0;
    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
      scan = s.strstart - 1;
      prev = _win[scan];
      if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
        strend = s.strstart + MAX_MATCH;
        do {
          /*jshint noempty:false*/
        } while (prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 scan < strend);
        s.match_length = MAX_MATCH - (strend - scan);
        if (s.match_length > s.lookahead) {
          s.match_length = s.lookahead;
        }
      }
      //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
    }

    /* Emit match if have run of MIN_MATCH or longer, else emit literal */
    if (s.match_length >= MIN_MATCH) {
      //check_match(s, s.strstart, s.strstart - 1, s.match_length);

      /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
      bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;
      s.strstart += s.match_length;
      s.match_length = 0;
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s->window[s->strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = _tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH$3) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
};

/* ===========================================================================
 * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
 * (It will be regenerated if this run of deflate switches away from Huffman.)
 */
const deflate_huff = (s, flush) => {

  let bflush;             /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we have a literal to write. */
    if (s.lookahead === 0) {
      fill_window(s);
      if (s.lookahead === 0) {
        if (flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        break;      /* flush the current block */
      }
    }

    /* Output a literal byte */
    s.match_length = 0;
    //Tracevv((stderr,"%c", s->window[s->strstart]));
    /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
    bflush = _tr_tally(s, 0, s.window[s.strstart]);
    s.lookahead--;
    s.strstart++;
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH$3) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
};

/* Values for max_lazy_match, good_match and max_chain_length, depending on
 * the desired pack level (0..9). The values given below have been tuned to
 * exclude worst case performance for pathological files. Better values may be
 * found for specific files.
 */
function Config(good_length, max_lazy, nice_length, max_chain, func) {

  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
}

const configuration_table = [
  /*      good lazy nice chain */
  new Config(0, 0, 0, 0, deflate_stored),          /* 0 store only */
  new Config(4, 4, 8, 4, deflate_fast),            /* 1 max speed, no lazy matches */
  new Config(4, 5, 16, 8, deflate_fast),           /* 2 */
  new Config(4, 6, 32, 32, deflate_fast),          /* 3 */

  new Config(4, 4, 16, 16, deflate_slow),          /* 4 lazy matches */
  new Config(8, 16, 32, 32, deflate_slow),         /* 5 */
  new Config(8, 16, 128, 128, deflate_slow),       /* 6 */
  new Config(8, 32, 128, 256, deflate_slow),       /* 7 */
  new Config(32, 128, 258, 1024, deflate_slow),    /* 8 */
  new Config(32, 258, 258, 4096, deflate_slow)     /* 9 max compression */
];


/* ===========================================================================
 * Initialize the "longest match" routines for a new zlib stream
 */
const lm_init = (s) => {

  s.window_size = 2 * s.w_size;

  /*** CLEAR_HASH(s); ***/
  zero(s.head); // Fill with NIL (= 0);

  /* Set the default configuration parameters:
   */
  s.max_lazy_match = configuration_table[s.level].max_lazy;
  s.good_match = configuration_table[s.level].good_length;
  s.nice_match = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;

  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  s.ins_h = 0;
};


function DeflateState() {
  this.strm = null;            /* pointer back to this zlib stream */
  this.status = 0;            /* as the name implies */
  this.pending_buf = null;      /* output still pending */
  this.pending_buf_size = 0;  /* size of pending_buf */
  this.pending_out = 0;       /* next pending byte to output to the stream */
  this.pending = 0;           /* nb of bytes in the pending buffer */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.gzhead = null;         /* gzip header information to write */
  this.gzindex = 0;           /* where in extra, name, or comment */
  this.method = Z_DEFLATED$2; /* can only be DEFLATED */
  this.last_flush = -1;   /* value of flush param for previous deflate call */

  this.w_size = 0;  /* LZ77 window size (32K by default) */
  this.w_bits = 0;  /* log2(w_size)  (8..16) */
  this.w_mask = 0;  /* w_size - 1 */

  this.window = null;
  /* Sliding window. Input bytes are read into the second half of the window,
   * and move to the first half later to keep a dictionary of at least wSize
   * bytes. With this organization, matches are limited to a distance of
   * wSize-MAX_MATCH bytes, but this ensures that IO is always
   * performed with a length multiple of the block size.
   */

  this.window_size = 0;
  /* Actual size of window: 2*wSize, except when the user input buffer
   * is directly used as sliding window.
   */

  this.prev = null;
  /* Link to older string with same hash index. To limit the size of this
   * array to 64K, this link is maintained only for the last 32K strings.
   * An index in this array is thus a window index modulo 32K.
   */

  this.head = null;   /* Heads of the hash chains or NIL. */

  this.ins_h = 0;       /* hash index of string to be inserted */
  this.hash_size = 0;   /* number of elements in hash table */
  this.hash_bits = 0;   /* log2(hash_size) */
  this.hash_mask = 0;   /* hash_size-1 */

  this.hash_shift = 0;
  /* Number of bits by which ins_h must be shifted at each input
   * step. It must be such that after MIN_MATCH steps, the oldest
   * byte no longer takes part in the hash key, that is:
   *   hash_shift * MIN_MATCH >= hash_bits
   */

  this.block_start = 0;
  /* Window position at the beginning of the current output block. Gets
   * negative when the window is moved backwards.
   */

  this.match_length = 0;      /* length of best match */
  this.prev_match = 0;        /* previous match */
  this.match_available = 0;   /* set if previous match exists */
  this.strstart = 0;          /* start of string to insert */
  this.match_start = 0;       /* start of matching string */
  this.lookahead = 0;         /* number of valid bytes ahead in window */

  this.prev_length = 0;
  /* Length of the best match at previous step. Matches not greater than this
   * are discarded. This is used in the lazy match evaluation.
   */

  this.max_chain_length = 0;
  /* To speed up deflation, hash chains are never searched beyond this
   * length.  A higher limit improves compression ratio but degrades the
   * speed.
   */

  this.max_lazy_match = 0;
  /* Attempt to find a better match only when the current match is strictly
   * smaller than this value. This mechanism is used only for compression
   * levels >= 4.
   */
  // That's alias to max_lazy_match, don't use directly
  //this.max_insert_length = 0;
  /* Insert new strings in the hash table only if the match length is not
   * greater than this length. This saves time but degrades compression.
   * max_insert_length is used only for compression levels <= 3.
   */

  this.level = 0;     /* compression level (1..9) */
  this.strategy = 0;  /* favor or force Huffman coding*/

  this.good_match = 0;
  /* Use a faster search when the previous match is longer than this */

  this.nice_match = 0; /* Stop searching when current match exceeds this */

              /* used by trees.c: */

  /* Didn't use ct_data typedef below to suppress compiler warning */

  // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
  // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
  // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */

  // Use flat array of DOUBLE size, with interleaved fata,
  // because JS does not support effective
  this.dyn_ltree  = new Uint16Array(HEAP_SIZE * 2);
  this.dyn_dtree  = new Uint16Array((2 * D_CODES + 1) * 2);
  this.bl_tree    = new Uint16Array((2 * BL_CODES + 1) * 2);
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);

  this.l_desc   = null;         /* desc. for literal tree */
  this.d_desc   = null;         /* desc. for distance tree */
  this.bl_desc  = null;         /* desc. for bit length tree */

  //ush bl_count[MAX_BITS+1];
  this.bl_count = new Uint16Array(MAX_BITS + 1);
  /* number of codes at each bit length for an optimal tree */

  //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
  this.heap = new Uint16Array(2 * L_CODES + 1);  /* heap used to build the Huffman trees */
  zero(this.heap);

  this.heap_len = 0;               /* number of elements in the heap */
  this.heap_max = 0;               /* element of largest frequency */
  /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
   * The same heap array is used to build all trees.
   */

  this.depth = new Uint16Array(2 * L_CODES + 1); //uch depth[2*L_CODES+1];
  zero(this.depth);
  /* Depth of each subtree used as tie breaker for trees of equal frequency
   */

  this.sym_buf = 0;        /* buffer for distances and literals/lengths */

  this.lit_bufsize = 0;
  /* Size of match buffer for literals/lengths.  There are 4 reasons for
   * limiting lit_bufsize to 64K:
   *   - frequencies can be kept in 16 bit counters
   *   - if compression is not successful for the first block, all input
   *     data is still in the window so we can still emit a stored block even
   *     when input comes from standard input.  (This can also be done for
   *     all blocks if lit_bufsize is not greater than 32K.)
   *   - if compression is not successful for a file smaller than 64K, we can
   *     even emit a stored file instead of a stored block (saving 5 bytes).
   *     This is applicable only for zip (not gzip or zlib).
   *   - creating new Huffman trees less frequently may not provide fast
   *     adaptation to changes in the input data statistics. (Take for
   *     example a binary file with poorly compressible code followed by
   *     a highly compressible string table.) Smaller buffer sizes give
   *     fast adaptation but have of course the overhead of transmitting
   *     trees more frequently.
   *   - I can't count above 4
   */

  this.sym_next = 0;      /* running index in sym_buf */
  this.sym_end = 0;       /* symbol table full when sym_next reaches this */

  this.opt_len = 0;       /* bit length of current block with optimal trees */
  this.static_len = 0;    /* bit length of current block with static trees */
  this.matches = 0;       /* number of string matches in current block */
  this.insert = 0;        /* bytes at end of window left to insert */


  this.bi_buf = 0;
  /* Output buffer. bits are inserted starting at the bottom (least
   * significant bits).
   */
  this.bi_valid = 0;
  /* Number of valid bits in bi_buf.  All bits above the last valid bit
   * are always zero.
   */

  // Used for window memory init. We safely ignore it for JS. That makes
  // sense only for pointers and memory check tools.
  //this.high_water = 0;
  /* High water mark offset in window for initialized bytes -- bytes above
   * this are set to zero in order to avoid memory check warnings when
   * longest match routines access bytes past the input.  This is then
   * updated to the new high water mark.
   */
}


/* =========================================================================
 * Check for a valid deflate stream state. Return 0 if ok, 1 if not.
 */
const deflateStateCheck = (strm) => {

  if (!strm) {
    return 1;
  }
  const s = strm.state;
  if (!s || s.strm !== strm || (s.status !== INIT_STATE &&
//#ifdef GZIP
                                s.status !== GZIP_STATE &&
//#endif
                                s.status !== EXTRA_STATE &&
                                s.status !== NAME_STATE &&
                                s.status !== COMMENT_STATE &&
                                s.status !== HCRC_STATE &&
                                s.status !== BUSY_STATE &&
                                s.status !== FINISH_STATE)) {
    return 1;
  }
  return 0;
};


const deflateResetKeep = (strm) => {

  if (deflateStateCheck(strm)) {
    return err(strm, Z_STREAM_ERROR$2);
  }

  strm.total_in = strm.total_out = 0;
  strm.data_type = Z_UNKNOWN;

  const s = strm.state;
  s.pending = 0;
  s.pending_out = 0;

  if (s.wrap < 0) {
    s.wrap = -s.wrap;
    /* was made negative by deflate(..., Z_FINISH); */
  }
  s.status =
//#ifdef GZIP
    s.wrap === 2 ? GZIP_STATE :
//#endif
    s.wrap ? INIT_STATE : BUSY_STATE;
  strm.adler = (s.wrap === 2) ?
    0  // crc32(0, Z_NULL, 0)
  :
    1; // adler32(0, Z_NULL, 0)
  s.last_flush = -2;
  _tr_init(s);
  return Z_OK$3;
};


const deflateReset = (strm) => {

  const ret = deflateResetKeep(strm);
  if (ret === Z_OK$3) {
    lm_init(strm.state);
  }
  return ret;
};


const deflateSetHeader = (strm, head) => {

  if (deflateStateCheck(strm) || strm.state.wrap !== 2) {
    return Z_STREAM_ERROR$2;
  }
  strm.state.gzhead = head;
  return Z_OK$3;
};


const deflateInit2 = (strm, level, method, windowBits, memLevel, strategy) => {

  if (!strm) { // === Z_NULL
    return Z_STREAM_ERROR$2;
  }
  let wrap = 1;

  if (level === Z_DEFAULT_COMPRESSION$1) {
    level = 6;
  }

  if (windowBits < 0) { /* suppress zlib wrapper */
    wrap = 0;
    windowBits = -windowBits;
  }

  else if (windowBits > 15) {
    wrap = 2;           /* write gzip wrapper instead */
    windowBits -= 16;
  }


  if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED$2 ||
    windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
    strategy < 0 || strategy > Z_FIXED || (windowBits === 8 && wrap !== 1)) {
    return err(strm, Z_STREAM_ERROR$2);
  }


  if (windowBits === 8) {
    windowBits = 9;
  }
  /* until 256-byte window bug fixed */

  const s = new DeflateState();

  strm.state = s;
  s.strm = strm;
  s.status = INIT_STATE;     /* to pass state test in deflateReset() */

  s.wrap = wrap;
  s.gzhead = null;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;

  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);

  s.window = new Uint8Array(s.w_size * 2);
  s.head = new Uint16Array(s.hash_size);
  s.prev = new Uint16Array(s.w_size);

  // Don't need mem init magic for JS.
  //s.high_water = 0;  /* nothing written to s->window yet */

  s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

  /* We overlay pending_buf and sym_buf. This works since the average size
   * for length/distance pairs over any compressed block is assured to be 31
   * bits or less.
   *
   * Analysis: The longest fixed codes are a length code of 8 bits plus 5
   * extra bits, for lengths 131 to 257. The longest fixed distance codes are
   * 5 bits plus 13 extra bits, for distances 16385 to 32768. The longest
   * possible fixed-codes length/distance pair is then 31 bits total.
   *
   * sym_buf starts one-fourth of the way into pending_buf. So there are
   * three bytes in sym_buf for every four bytes in pending_buf. Each symbol
   * in sym_buf is three bytes -- two for the distance and one for the
   * literal/length. As each symbol is consumed, the pointer to the next
   * sym_buf value to read moves forward three bytes. From that symbol, up to
   * 31 bits are written to pending_buf. The closest the written pending_buf
   * bits gets to the next sym_buf symbol to read is just before the last
   * code is written. At that time, 31*(n-2) bits have been written, just
   * after 24*(n-2) bits have been consumed from sym_buf. sym_buf starts at
   * 8*n bits into pending_buf. (Note that the symbol buffer fills when n-1
   * symbols are written.) The closest the writing gets to what is unread is
   * then n+14 bits. Here n is lit_bufsize, which is 16384 by default, and
   * can range from 128 to 32768.
   *
   * Therefore, at a minimum, there are 142 bits of space between what is
   * written and what is read in the overlain buffers, so the symbols cannot
   * be overwritten by the compressed data. That space is actually 139 bits,
   * due to the three-bit fixed-code block header.
   *
   * That covers the case where either Z_FIXED is specified, forcing fixed
   * codes, or when the use of fixed codes is chosen, because that choice
   * results in a smaller compressed block than dynamic codes. That latter
   * condition then assures that the above analysis also covers all dynamic
   * blocks. A dynamic-code block will only be chosen to be emitted if it has
   * fewer bits than a fixed-code block would for the same set of symbols.
   * Therefore its average symbol length is assured to be less than 31. So
   * the compressed data for a dynamic block also cannot overwrite the
   * symbols from which it is being constructed.
   */

  s.pending_buf_size = s.lit_bufsize * 4;
  s.pending_buf = new Uint8Array(s.pending_buf_size);

  // It is offset from `s.pending_buf` (size is `s.lit_bufsize * 2`)
  //s->sym_buf = s->pending_buf + s->lit_bufsize;
  s.sym_buf = s.lit_bufsize;

  //s->sym_end = (s->lit_bufsize - 1) * 3;
  s.sym_end = (s.lit_bufsize - 1) * 3;
  /* We avoid equality with lit_bufsize*3 because of wraparound at 64K
   * on 16 bit machines and because stored blocks are restricted to
   * 64K-1 bytes.
   */

  s.level = level;
  s.strategy = strategy;
  s.method = method;

  return deflateReset(strm);
};

const deflateInit = (strm, level) => {

  return deflateInit2(strm, level, Z_DEFLATED$2, MAX_WBITS$1, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY$1);
};


/* ========================================================================= */
const deflate$2 = (strm, flush) => {

  if (deflateStateCheck(strm) || flush > Z_BLOCK$1 || flush < 0) {
    return strm ? err(strm, Z_STREAM_ERROR$2) : Z_STREAM_ERROR$2;
  }

  const s = strm.state;

  if (!strm.output ||
      (strm.avail_in !== 0 && !strm.input) ||
      (s.status === FINISH_STATE && flush !== Z_FINISH$3)) {
    return err(strm, (strm.avail_out === 0) ? Z_BUF_ERROR$1 : Z_STREAM_ERROR$2);
  }

  const old_flush = s.last_flush;
  s.last_flush = flush;

  /* Flush as much pending output as possible */
  if (s.pending !== 0) {
    flush_pending(strm);
    if (strm.avail_out === 0) {
      /* Since avail_out is 0, deflate will be called again with
       * more output space, but possibly with both pending and
       * avail_in equal to zero. There won't be anything to do,
       * but this is not an error situation so make sure we
       * return OK instead of BUF_ERROR at next call of deflate:
       */
      s.last_flush = -1;
      return Z_OK$3;
    }

    /* Make sure there is something to do and avoid duplicate consecutive
     * flushes. For repeated and useless calls with Z_FINISH, we keep
     * returning Z_STREAM_END instead of Z_BUF_ERROR.
     */
  } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
    flush !== Z_FINISH$3) {
    return err(strm, Z_BUF_ERROR$1);
  }

  /* User must not provide more input after the first FINISH: */
  if (s.status === FINISH_STATE && strm.avail_in !== 0) {
    return err(strm, Z_BUF_ERROR$1);
  }

  /* Write the header */
  if (s.status === INIT_STATE && s.wrap === 0) {
    s.status = BUSY_STATE;
  }
  if (s.status === INIT_STATE) {
    /* zlib header */
    let header = (Z_DEFLATED$2 + ((s.w_bits - 8) << 4)) << 8;
    let level_flags = -1;

    if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
      level_flags = 0;
    } else if (s.level < 6) {
      level_flags = 1;
    } else if (s.level === 6) {
      level_flags = 2;
    } else {
      level_flags = 3;
    }
    header |= (level_flags << 6);
    if (s.strstart !== 0) { header |= PRESET_DICT; }
    header += 31 - (header % 31);

    putShortMSB(s, header);

    /* Save the adler32 of the preset dictionary: */
    if (s.strstart !== 0) {
      putShortMSB(s, strm.adler >>> 16);
      putShortMSB(s, strm.adler & 0xffff);
    }
    strm.adler = 1; // adler32(0L, Z_NULL, 0);
    s.status = BUSY_STATE;

    /* Compression must start with an empty pending buffer */
    flush_pending(strm);
    if (s.pending !== 0) {
      s.last_flush = -1;
      return Z_OK$3;
    }
  }
//#ifdef GZIP
  if (s.status === GZIP_STATE) {
    /* gzip header */
    strm.adler = 0;  //crc32(0L, Z_NULL, 0);
    put_byte(s, 31);
    put_byte(s, 139);
    put_byte(s, 8);
    if (!s.gzhead) { // s->gzhead == Z_NULL
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, s.level === 9 ? 2 :
                  (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                   4 : 0));
      put_byte(s, OS_CODE);
      s.status = BUSY_STATE;

      /* Compression must start with an empty pending buffer */
      flush_pending(strm);
      if (s.pending !== 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    }
    else {
      put_byte(s, (s.gzhead.text ? 1 : 0) +
                  (s.gzhead.hcrc ? 2 : 0) +
                  (!s.gzhead.extra ? 0 : 4) +
                  (!s.gzhead.name ? 0 : 8) +
                  (!s.gzhead.comment ? 0 : 16)
      );
      put_byte(s, s.gzhead.time & 0xff);
      put_byte(s, (s.gzhead.time >> 8) & 0xff);
      put_byte(s, (s.gzhead.time >> 16) & 0xff);
      put_byte(s, (s.gzhead.time >> 24) & 0xff);
      put_byte(s, s.level === 9 ? 2 :
                  (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                   4 : 0));
      put_byte(s, s.gzhead.os & 0xff);
      if (s.gzhead.extra && s.gzhead.extra.length) {
        put_byte(s, s.gzhead.extra.length & 0xff);
        put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
      }
      if (s.gzhead.hcrc) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending, 0);
      }
      s.gzindex = 0;
      s.status = EXTRA_STATE;
    }
  }
  if (s.status === EXTRA_STATE) {
    if (s.gzhead.extra/* != Z_NULL*/) {
      let beg = s.pending;   /* start of bytes to update crc */
      let left = (s.gzhead.extra.length & 0xffff) - s.gzindex;
      while (s.pending + left > s.pending_buf_size) {
        let copy = s.pending_buf_size - s.pending;
        // zmemcpy(s.pending_buf + s.pending,
        //    s.gzhead.extra + s.gzindex, copy);
        s.pending_buf.set(s.gzhead.extra.subarray(s.gzindex, s.gzindex + copy), s.pending);
        s.pending = s.pending_buf_size;
        //--- HCRC_UPDATE(beg) ---//
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
        //---//
        s.gzindex += copy;
        flush_pending(strm);
        if (s.pending !== 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
        beg = 0;
        left -= copy;
      }
      // JS specific: s.gzhead.extra may be TypedArray or Array for backward compatibility
      //              TypedArray.slice and TypedArray.from don't exist in IE10-IE11
      let gzhead_extra = new Uint8Array(s.gzhead.extra);
      // zmemcpy(s->pending_buf + s->pending,
      //     s->gzhead->extra + s->gzindex, left);
      s.pending_buf.set(gzhead_extra.subarray(s.gzindex, s.gzindex + left), s.pending);
      s.pending += left;
      //--- HCRC_UPDATE(beg) ---//
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      //---//
      s.gzindex = 0;
    }
    s.status = NAME_STATE;
  }
  if (s.status === NAME_STATE) {
    if (s.gzhead.name/* != Z_NULL*/) {
      let beg = s.pending;   /* start of bytes to update crc */
      let val;
      do {
        if (s.pending === s.pending_buf_size) {
          //--- HCRC_UPDATE(beg) ---//
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          //---//
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
          beg = 0;
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.name.length) {
          val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);
      //--- HCRC_UPDATE(beg) ---//
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      //---//
      s.gzindex = 0;
    }
    s.status = COMMENT_STATE;
  }
  if (s.status === COMMENT_STATE) {
    if (s.gzhead.comment/* != Z_NULL*/) {
      let beg = s.pending;   /* start of bytes to update crc */
      let val;
      do {
        if (s.pending === s.pending_buf_size) {
          //--- HCRC_UPDATE(beg) ---//
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          //---//
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
          beg = 0;
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.comment.length) {
          val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);
      //--- HCRC_UPDATE(beg) ---//
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      //---//
    }
    s.status = HCRC_STATE;
  }
  if (s.status === HCRC_STATE) {
    if (s.gzhead.hcrc) {
      if (s.pending + 2 > s.pending_buf_size) {
        flush_pending(strm);
        if (s.pending !== 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
      }
      put_byte(s, strm.adler & 0xff);
      put_byte(s, (strm.adler >> 8) & 0xff);
      strm.adler = 0; //crc32(0L, Z_NULL, 0);
    }
    s.status = BUSY_STATE;

    /* Compression must start with an empty pending buffer */
    flush_pending(strm);
    if (s.pending !== 0) {
      s.last_flush = -1;
      return Z_OK$3;
    }
  }
//#endif

  /* Start a new block or continue the current one.
   */
  if (strm.avail_in !== 0 || s.lookahead !== 0 ||
    (flush !== Z_NO_FLUSH$2 && s.status !== FINISH_STATE)) {
    let bstate = s.level === 0 ? deflate_stored(s, flush) :
                 s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) :
                 s.strategy === Z_RLE ? deflate_rle(s, flush) :
                 configuration_table[s.level].func(s, flush);

    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
      s.status = FINISH_STATE;
    }
    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        /* avoid BUF_ERROR next call, see above */
      }
      return Z_OK$3;
      /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
       * of deflate should use the same flush parameter to make sure
       * that the flush is complete. So we don't have to output an
       * empty block here, this will be done at next call. This also
       * ensures that for a very small output buffer, we emit at most
       * one empty block.
       */
    }
    if (bstate === BS_BLOCK_DONE) {
      if (flush === Z_PARTIAL_FLUSH) {
        _tr_align(s);
      }
      else if (flush !== Z_BLOCK$1) { /* FULL_FLUSH or SYNC_FLUSH */

        _tr_stored_block(s, 0, 0, false);
        /* For a full flush, this empty block will be recognized
         * as a special marker by inflate_sync().
         */
        if (flush === Z_FULL_FLUSH$1) {
          /*** CLEAR_HASH(s); ***/             /* forget history */
          zero(s.head); // Fill with NIL (= 0);

          if (s.lookahead === 0) {
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
        }
      }
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
        return Z_OK$3;
      }
    }
  }

  if (flush !== Z_FINISH$3) { return Z_OK$3; }
  if (s.wrap <= 0) { return Z_STREAM_END$3; }

  /* Write the trailer */
  if (s.wrap === 2) {
    put_byte(s, strm.adler & 0xff);
    put_byte(s, (strm.adler >> 8) & 0xff);
    put_byte(s, (strm.adler >> 16) & 0xff);
    put_byte(s, (strm.adler >> 24) & 0xff);
    put_byte(s, strm.total_in & 0xff);
    put_byte(s, (strm.total_in >> 8) & 0xff);
    put_byte(s, (strm.total_in >> 16) & 0xff);
    put_byte(s, (strm.total_in >> 24) & 0xff);
  }
  else
  {
    putShortMSB(s, strm.adler >>> 16);
    putShortMSB(s, strm.adler & 0xffff);
  }

  flush_pending(strm);
  /* If avail_out is zero, the application will call deflate again
   * to flush the rest.
   */
  if (s.wrap > 0) { s.wrap = -s.wrap; }
  /* write the trailer only once! */
  return s.pending !== 0 ? Z_OK$3 : Z_STREAM_END$3;
};


const deflateEnd = (strm) => {

  if (deflateStateCheck(strm)) {
    return Z_STREAM_ERROR$2;
  }

  const status = strm.state.status;

  strm.state = null;

  return status === BUSY_STATE ? err(strm, Z_DATA_ERROR$2) : Z_OK$3;
};


/* =========================================================================
 * Initializes the compression dictionary from the given byte
 * sequence without producing any compressed output.
 */
const deflateSetDictionary = (strm, dictionary) => {

  let dictLength = dictionary.length;

  if (deflateStateCheck(strm)) {
    return Z_STREAM_ERROR$2;
  }

  const s = strm.state;
  const wrap = s.wrap;

  if (wrap === 2 || (wrap === 1 && s.status !== INIT_STATE) || s.lookahead) {
    return Z_STREAM_ERROR$2;
  }

  /* when using zlib wrappers, compute Adler-32 for provided dictionary */
  if (wrap === 1) {
    /* adler32(strm->adler, dictionary, dictLength); */
    strm.adler = adler32_1(strm.adler, dictionary, dictLength, 0);
  }

  s.wrap = 0;   /* avoid computing Adler-32 in read_buf */

  /* if dictionary would fill window, just replace the history */
  if (dictLength >= s.w_size) {
    if (wrap === 0) {            /* already empty otherwise */
      /*** CLEAR_HASH(s); ***/
      zero(s.head); // Fill with NIL (= 0);
      s.strstart = 0;
      s.block_start = 0;
      s.insert = 0;
    }
    /* use the tail */
    // dictionary = dictionary.slice(dictLength - s.w_size);
    let tmpDict = new Uint8Array(s.w_size);
    tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
    dictionary = tmpDict;
    dictLength = s.w_size;
  }
  /* insert dictionary into window and hash */
  const avail = strm.avail_in;
  const next = strm.next_in;
  const input = strm.input;
  strm.avail_in = dictLength;
  strm.next_in = 0;
  strm.input = dictionary;
  fill_window(s);
  while (s.lookahead >= MIN_MATCH) {
    let str = s.strstart;
    let n = s.lookahead - (MIN_MATCH - 1);
    do {
      /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
      s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);

      s.prev[str & s.w_mask] = s.head[s.ins_h];

      s.head[s.ins_h] = str;
      str++;
    } while (--n);
    s.strstart = str;
    s.lookahead = MIN_MATCH - 1;
    fill_window(s);
  }
  s.strstart += s.lookahead;
  s.block_start = s.strstart;
  s.insert = s.lookahead;
  s.lookahead = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  strm.next_in = next;
  strm.input = input;
  strm.avail_in = avail;
  s.wrap = wrap;
  return Z_OK$3;
};


var deflateInit_1 = deflateInit;
var deflateInit2_1 = deflateInit2;
var deflateReset_1 = deflateReset;
var deflateResetKeep_1 = deflateResetKeep;
var deflateSetHeader_1 = deflateSetHeader;
var deflate_2$1 = deflate$2;
var deflateEnd_1 = deflateEnd;
var deflateSetDictionary_1 = deflateSetDictionary;
var deflateInfo = 'pako deflate (from Nodeca project)';

/* Not implemented
module.exports.deflateBound = deflateBound;
module.exports.deflateCopy = deflateCopy;
module.exports.deflateGetDictionary = deflateGetDictionary;
module.exports.deflateParams = deflateParams;
module.exports.deflatePending = deflatePending;
module.exports.deflatePrime = deflatePrime;
module.exports.deflateTune = deflateTune;
*/

var deflate_1$2 = {
	deflateInit: deflateInit_1,
	deflateInit2: deflateInit2_1,
	deflateReset: deflateReset_1,
	deflateResetKeep: deflateResetKeep_1,
	deflateSetHeader: deflateSetHeader_1,
	deflate: deflate_2$1,
	deflateEnd: deflateEnd_1,
	deflateSetDictionary: deflateSetDictionary_1,
	deflateInfo: deflateInfo
};

const _has = (obj, key) => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

var assign = function (obj /*from1, from2, from3, ...*/) {
  const sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    const source = sources.shift();
    if (!source) { continue; }

    if (typeof source !== 'object') {
      throw new TypeError(source + 'must be non-object');
    }

    for (const p in source) {
      if (_has(source, p)) {
        obj[p] = source[p];
      }
    }
  }

  return obj;
};


// Join array of chunks to single array.
var flattenChunks = (chunks) => {
  // calculate data length
  let len = 0;

  for (let i = 0, l = chunks.length; i < l; i++) {
    len += chunks[i].length;
  }

  // join chunks
  const result = new Uint8Array(len);

  for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
    let chunk = chunks[i];
    result.set(chunk, pos);
    pos += chunk.length;
  }

  return result;
};

var common = {
	assign: assign,
	flattenChunks: flattenChunks
};

// String encode/decode helpers


// Quick check if we can use fast array to bin string conversion
//
// - apply(Array) can fail on Android 2.2
// - apply(Uint8Array) can fail on iOS 5.1 Safari
//
let STR_APPLY_UIA_OK = true;

try { String.fromCharCode.apply(null, new Uint8Array(1)); } catch (__) { STR_APPLY_UIA_OK = false; }


// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
const _utf8len = new Uint8Array(256);
for (let q = 0; q < 256; q++) {
  _utf8len[q] = (q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1);
}
_utf8len[254] = _utf8len[254] = 1; // Invalid sequence start


// convert string to array (typed, when possible)
var string2buf = (str) => {
  if (typeof TextEncoder === 'function' && TextEncoder.prototype.encode) {
    return new TextEncoder().encode(str);
  }

  let buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

  // count binary size
  for (m_pos = 0; m_pos < str_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }

  // allocate buffer
  buf = new Uint8Array(buf_len);

  // convert
  for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    if (c < 0x80) {
      /* one byte */
      buf[i++] = c;
    } else if (c < 0x800) {
      /* two bytes */
      buf[i++] = 0xC0 | (c >>> 6);
      buf[i++] = 0x80 | (c & 0x3f);
    } else if (c < 0x10000) {
      /* three bytes */
      buf[i++] = 0xE0 | (c >>> 12);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    } else {
      /* four bytes */
      buf[i++] = 0xf0 | (c >>> 18);
      buf[i++] = 0x80 | (c >>> 12 & 0x3f);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    }
  }

  return buf;
};

// Helper
const buf2binstring = (buf, len) => {
  // On Chrome, the arguments in a function call that are allowed is `65534`.
  // If the length of the buffer is smaller than that, we can use this optimization,
  // otherwise we will take a slower path.
  if (len < 65534) {
    if (buf.subarray && STR_APPLY_UIA_OK) {
      return String.fromCharCode.apply(null, buf.length === len ? buf : buf.subarray(0, len));
    }
  }

  let result = '';
  for (let i = 0; i < len; i++) {
    result += String.fromCharCode(buf[i]);
  }
  return result;
};


// convert array to string
var buf2string = (buf, max) => {
  const len = max || buf.length;

  if (typeof TextDecoder === 'function' && TextDecoder.prototype.decode) {
    return new TextDecoder().decode(buf.subarray(0, max));
  }

  let i, out;

  // Reserve max possible length (2 words per char)
  // NB: by unknown reasons, Array is significantly faster for
  //     String.fromCharCode.apply than Uint16Array.
  const utf16buf = new Array(len * 2);

  for (out = 0, i = 0; i < len;) {
    let c = buf[i++];
    // quick process ascii
    if (c < 0x80) { utf16buf[out++] = c; continue; }

    let c_len = _utf8len[c];
    // skip 5 & 6 byte codes
    if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len - 1; continue; }

    // apply mask on first byte
    c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
    // join the rest
    while (c_len > 1 && i < len) {
      c = (c << 6) | (buf[i++] & 0x3f);
      c_len--;
    }

    // terminated by end of string?
    if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

    if (c < 0x10000) {
      utf16buf[out++] = c;
    } else {
      c -= 0x10000;
      utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
      utf16buf[out++] = 0xdc00 | (c & 0x3ff);
    }
  }

  return buf2binstring(utf16buf, out);
};


// Calculate max possible position in utf8 buffer,
// that will not break sequence. If that's not possible
// - (very small limits) return max size as is.
//
// buf[] - utf8 bytes array
// max   - length limit (mandatory);
var utf8border = (buf, max) => {

  max = max || buf.length;
  if (max > buf.length) { max = buf.length; }

  // go back from last position, until start of sequence found
  let pos = max - 1;
  while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

  // Very small and broken sequence,
  // return max, because we should return something anyway.
  if (pos < 0) { return max; }

  // If we came to start of buffer - that means buffer is too small,
  // return max too.
  if (pos === 0) { return max; }

  return (pos + _utf8len[buf[pos]] > max) ? pos : max;
};

var strings = {
	string2buf: string2buf,
	buf2string: buf2string,
	utf8border: utf8border
};

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

function ZStream() {
  /* next input byte */
  this.input = null; // JS specific, because we have no pointers
  this.next_in = 0;
  /* number of bytes available at input */
  this.avail_in = 0;
  /* total number of input bytes read so far */
  this.total_in = 0;
  /* next output byte should be put there */
  this.output = null; // JS specific, because we have no pointers
  this.next_out = 0;
  /* remaining free space at output */
  this.avail_out = 0;
  /* total number of bytes output so far */
  this.total_out = 0;
  /* last error message, NULL if no error */
  this.msg = ''/*Z_NULL*/;
  /* not visible by applications */
  this.state = null;
  /* best guess about the data type: binary or text */
  this.data_type = 2/*Z_UNKNOWN*/;
  /* adler32 value of the uncompressed data */
  this.adler = 0;
}

var zstream = ZStream;

const toString$1 = Object.prototype.toString;

/* Public constants ==========================================================*/
/* ===========================================================================*/

const {
  Z_NO_FLUSH: Z_NO_FLUSH$1, Z_SYNC_FLUSH, Z_FULL_FLUSH, Z_FINISH: Z_FINISH$2,
  Z_OK: Z_OK$2, Z_STREAM_END: Z_STREAM_END$2,
  Z_DEFAULT_COMPRESSION,
  Z_DEFAULT_STRATEGY,
  Z_DEFLATED: Z_DEFLATED$1
} = constants$2;

/* ===========================================================================*/


/**
 * class Deflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[deflate]],
 * [[deflateRaw]] and [[gzip]].
 **/

/* internal
 * Deflate.chunks -> Array
 *
 * Chunks of output data, if [[Deflate#onData]] not overridden.
 **/

/**
 * Deflate.result -> Uint8Array
 *
 * Compressed result, generated by default [[Deflate#onData]]
 * and [[Deflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Deflate#push]] with `Z_FINISH` / `true` param).
 **/

/**
 * Deflate.err -> Number
 *
 * Error code after deflate finished. 0 (Z_OK) on success.
 * You will not need it in real life, because deflate errors
 * are possible only on wrong options or bad `onData` / `onEnd`
 * custom handlers.
 **/

/**
 * Deflate.msg -> String
 *
 * Error message, if [[Deflate.err]] != 0
 **/


/**
 * new Deflate(options)
 * - options (Object): zlib deflate options.
 *
 * Creates new deflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `level`
 * - `windowBits`
 * - `memLevel`
 * - `strategy`
 * - `dictionary`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw deflate
 * - `gzip` (Boolean) - create gzip wrapper
 * - `header` (Object) - custom header for gzip
 *   - `text` (Boolean) - true if compressed data believed to be text
 *   - `time` (Number) - modification time, unix timestamp
 *   - `os` (Number) - operation system code
 *   - `extra` (Array) - array of bytes with extra data (max 65536)
 *   - `name` (String) - file name (binary string)
 *   - `comment` (String) - comment (binary string)
 *   - `hcrc` (Boolean) - true if header crc should be added
 *
 * ##### Example:
 *
 * ```javascript
 * const pako = require('pako')
 *   , chunk1 = new Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = new Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * const deflate = new pako.Deflate({ level: 3});
 *
 * deflate.push(chunk1, false);
 * deflate.push(chunk2, true);  // true -> last chunk
 *
 * if (deflate.err) { throw new Error(deflate.err); }
 *
 * console.log(deflate.result);
 * ```
 **/
function Deflate$1(options) {
  this.options = common.assign({
    level: Z_DEFAULT_COMPRESSION,
    method: Z_DEFLATED$1,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: Z_DEFAULT_STRATEGY
  }, options || {});

  let opt = this.options;

  if (opt.raw && (opt.windowBits > 0)) {
    opt.windowBits = -opt.windowBits;
  }

  else if (opt.gzip && (opt.windowBits > 0) && (opt.windowBits < 16)) {
    opt.windowBits += 16;
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm = new zstream();
  this.strm.avail_out = 0;

  let status = deflate_1$2.deflateInit2(
    this.strm,
    opt.level,
    opt.method,
    opt.windowBits,
    opt.memLevel,
    opt.strategy
  );

  if (status !== Z_OK$2) {
    throw new Error(messages[status]);
  }

  if (opt.header) {
    deflate_1$2.deflateSetHeader(this.strm, opt.header);
  }

  if (opt.dictionary) {
    let dict;
    // Convert data if needed
    if (typeof opt.dictionary === 'string') {
      // If we need to compress text, change encoding to utf8.
      dict = strings.string2buf(opt.dictionary);
    } else if (toString$1.call(opt.dictionary) === '[object ArrayBuffer]') {
      dict = new Uint8Array(opt.dictionary);
    } else {
      dict = opt.dictionary;
    }

    status = deflate_1$2.deflateSetDictionary(this.strm, dict);

    if (status !== Z_OK$2) {
      throw new Error(messages[status]);
    }

    this._dict_set = true;
  }
}

/**
 * Deflate#push(data[, flush_mode]) -> Boolean
 * - data (Uint8Array|ArrayBuffer|String): input data. Strings will be
 *   converted to utf8 byte sequence.
 * - flush_mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` means Z_FINISH.
 *
 * Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
 * new compressed chunks. Returns `true` on success. The last data block must
 * have `flush_mode` Z_FINISH (or `true`). That will flush internal pending
 * buffers and call [[Deflate#onEnd]].
 *
 * On fail call [[Deflate#onEnd]] with error code and return false.
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Deflate$1.prototype.push = function (data, flush_mode) {
  const strm = this.strm;
  const chunkSize = this.options.chunkSize;
  let status, _flush_mode;

  if (this.ended) { return false; }

  if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
  else _flush_mode = flush_mode === true ? Z_FINISH$2 : Z_NO_FLUSH$1;

  // Convert data if needed
  if (typeof data === 'string') {
    // If we need to compress text, change encoding to utf8.
    strm.input = strings.string2buf(data);
  } else if (toString$1.call(data) === '[object ArrayBuffer]') {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  for (;;) {
    if (strm.avail_out === 0) {
      strm.output = new Uint8Array(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }

    // Make sure avail_out > 6 to avoid repeating markers
    if ((_flush_mode === Z_SYNC_FLUSH || _flush_mode === Z_FULL_FLUSH) && strm.avail_out <= 6) {
      this.onData(strm.output.subarray(0, strm.next_out));
      strm.avail_out = 0;
      continue;
    }

    status = deflate_1$2.deflate(strm, _flush_mode);

    // Ended => flush and finish
    if (status === Z_STREAM_END$2) {
      if (strm.next_out > 0) {
        this.onData(strm.output.subarray(0, strm.next_out));
      }
      status = deflate_1$2.deflateEnd(this.strm);
      this.onEnd(status);
      this.ended = true;
      return status === Z_OK$2;
    }

    // Flush if out buffer full
    if (strm.avail_out === 0) {
      this.onData(strm.output);
      continue;
    }

    // Flush if requested and has data
    if (_flush_mode > 0 && strm.next_out > 0) {
      this.onData(strm.output.subarray(0, strm.next_out));
      strm.avail_out = 0;
      continue;
    }

    if (strm.avail_in === 0) break;
  }

  return true;
};


/**
 * Deflate#onData(chunk) -> Void
 * - chunk (Uint8Array): output data.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Deflate$1.prototype.onData = function (chunk) {
  this.chunks.push(chunk);
};


/**
 * Deflate#onEnd(status) -> Void
 * - status (Number): deflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called once after you tell deflate that the input stream is
 * complete (Z_FINISH). By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Deflate$1.prototype.onEnd = function (status) {
  // On success - join
  if (status === Z_OK$2) {
    this.result = common.flattenChunks(this.chunks);
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * deflate(data[, options]) -> Uint8Array
 * - data (Uint8Array|ArrayBuffer|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * Compress `data` with deflate algorithm and `options`.
 *
 * Supported options are:
 *
 * - level
 * - windowBits
 * - memLevel
 * - strategy
 * - dictionary
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 *
 * ##### Example:
 *
 * ```javascript
 * const pako = require('pako')
 * const data = new Uint8Array([1,2,3,4,5,6,7,8,9]);
 *
 * console.log(pako.deflate(data));
 * ```
 **/
function deflate$1(input, options) {
  const deflator = new Deflate$1(options);

  deflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (deflator.err) { throw deflator.msg || messages[deflator.err]; }

  return deflator.result;
}
var deflate_2 = deflate$1;

var deflate_1$1 = {
	deflate: deflate_2};

const { deflate} = deflate_1$1;
var deflate_1 = deflate;

var UPNG = (function () {
  var _bin = {
    nextZero: function (data, p) {
      while (data[p] != 0) p++;
      return p
    },
    readUshort: function (buff, p) {
      return (buff[p] << 8) | buff[p + 1]
    },
    writeUshort: function (buff, p, n) {
      buff[p] = (n >> 8) & 255;
      buff[p + 1] = n & 255;
    },
    readUint: function (buff, p) {
      return (buff[p] * (256 * 256 * 256)) +
        ((buff[p + 1] << 16) | (buff[p + 2] << 8) | buff[p + 3])
    },
    writeUint: function (buff, p, n) {
      buff[p] = (n >> 24) & 255;
      buff[p + 1] = (n >> 16) & 255;
      buff[p + 2] = (n >> 8) & 255;
      buff[p + 3] = n & 255;
    },
    readASCII: function (buff, p, l) {
      var s = "";
      for (var i = 0; i < l; i++) s += String.fromCharCode(buff[p + i]);
      return s
    },
    writeASCII: function (data, p, s) {
      for (var i = 0; i < s.length; i++) data[p + i] = s.charCodeAt(i);
    },
    readBytes: function (buff, p, l) {
      var arr = [];
      for (var i = 0; i < l; i++) arr.push(buff[p + i]);
      return arr
    },
    pad: function (n) {
      return n.length < 2 ? "0" + n : n
    },
    readUTF8: function (buff, p, l) {
      var s = "", ns;
      for (var i = 0; i < l; i++) s += "%" + _bin.pad(buff[p + i].toString(16));
      try {
        ns = decodeURIComponent(s);
      } catch (e) {
        return _bin.readASCII(buff, p, l)
      }
      return ns
    },
  };
  return {
    _bin: _bin,
  }
})()
;(function () {
  var _bin = UPNG._bin;
  var crcLib = {
    table: (function () {
      var tab = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) {
          if (c & 1) c = 0xedb88320 ^ (c >>> 1);
          else c = c >>> 1;
        }
        tab[n] = c;
      }
      return tab
    })(),
    update: function (c, buf, off, len) {
      for (var i = 0; i < len; i++) {
        c = crcLib.table[(c ^ buf[off + i]) & 0xff] ^ (c >>> 8);
      }
      return c
    },
    crc: function (b, o, l) {
      return crcLib.update(0xffffffff, b, o, l) ^ 0xffffffff
    },
  };
  function encodeLL(bufs, w, h, cc, ac, depth, dels, tabs) {
		var nimg = {  ctype: 0 + (cc==1 ? 0 : 2) + (ac==0 ? 0 : 4),      depth: depth,  frames: []  };
		var bipp = (cc+ac)*depth, bipl = bipp * w;
		for(var i=0; i<bufs.length; i++)
			nimg.frames.push({  rect:{x:0,y:0,width:w,height:h},img:new Uint8Array(bufs[i]), blend:0,
    dispose:1, bpp:Math.ceil(bipp/8), bpl:Math.ceil(bipl/8)  });
		compressPNG(nimg, 0);
		var out = _main(nimg, w, h);
		return out;
	}
  function _main(nimg, w, h, dels, tabs) {
    var crc = crcLib.crc,
      wUi = _bin.writeUint;
      _bin.writeUshort;
      var wAs = _bin.writeASCII;
    var offset = 8;
    var leng = 8 + (16 + 5 + 4);
    for (var j = 0; j < nimg.frames.length; j++) {
      var fr = nimg.frames[j];
      leng += fr.cimg.length + 12;
      if (j != 0) leng += 4;
    }
    leng += 12;
    var data = new Uint8Array(leng);
    var wr = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (var i = 0; i < 8; i++) data[i] = wr[i];
    wUi(data, offset, 13);
    offset += 4;
    wAs(data, offset, "IHDR");
    offset += 4;
    wUi(data, offset, w);
    offset += 4;
    wUi(data, offset, h);
    offset += 4;
    data[offset] = nimg.depth;
    offset++; // depth
    data[offset] = nimg.ctype;
    offset++; // ctype
    data[offset] = 0;
    offset++; // compress
    data[offset] = 0;
    offset++; // filter
    data[offset] = 0;
    offset++; // interlace
    wUi(data, offset, crc(data, offset - 17, 17));
    offset += 4; // crc
    var fi = 0;
    for (var j = 0; j < nimg.frames.length; j++) {
      var fr = nimg.frames[j];
      var imgd = fr.cimg, dl = imgd.length;
      wUi(data, offset, dl + (j == 0 ? 0 : 4));
      offset += 4;
      var ioff = offset;
      wAs(data, offset, (j == 0) ? "IDAT" : "fdAT");
      offset += 4;
      if (j != 0) {
        wUi(data, offset, fi++);
        offset += 4;
      }
      data.set(imgd, offset);
      offset += dl;
      wUi(data, offset, crc(data, ioff, offset - ioff));
      offset += 4; // crc
    }
    wUi(data, offset, 0);
    offset += 4;
    wAs(data, offset, "IEND");
    offset += 4;
    wUi(data, offset, crc(data, offset - 4, 4));
    offset += 4; // crc
    return data.buffer
  }
  function compressPNG(out, filter, levelZero) {
    for (var i = 0; i < out.frames.length; i++) {
      var frm = out.frames[i], nh = frm.rect.height;
      var fdata = new Uint8Array(nh * frm.bpl + nh);
      frm.cimg = _filterZero( frm.img, nh, frm.bpp, frm.bpl, fdata, filter);
    }
  }
  function _filterZero(img, h, bpp, bpl, data, filter, levelZero) {
    var fls = [], ftry = [0, 1, 2, 3, 4];
    ftry = [filter];
    var opts;
    opts = { level: 0 };
    for (var i = 0; i < ftry.length; i++) {
      for (var y = 0; y < h; y++) _filterLine(data, img, y, bpl, bpp, ftry[i]);
      fls.push(deflate_1(data, opts));
    }
    var ti, tsize = 1e9;
    for (var i = 0; i < fls.length; i++) {
      if (fls[i].length < tsize) {
        ti = i;
        tsize = fls[i].length;
      }
    }
    return fls[ti]
  }
  function _filterLine(data, img, y, bpl, bpp, type) {
    var i = y * bpl, di = i + y;
    data[di] = type;
    di++;
    data.set(new Uint8Array(img.buffer, i, bpl), di);
  }
  UPNG.encodeLL = encodeLL;
})();

var ge=ArrayBuffer,C=Uint8Array,lr=Uint16Array,he=Int16Array;var yr=Int32Array,Mr=function(n,i,t){if(C.prototype.slice)return C.prototype.slice.call(n,i,t);(i==null||i<0)&&(i=0),(t==null||t>n.length)&&(t=n.length);var e=new C(t-i);return e.set(n.subarray(i,t)),e},vr=function(n,i,t,e){if(C.prototype.fill)return C.prototype.fill.call(n,i,t,e);for((t==null||t<0)&&(t=0),(e==null||e>n.length)&&(e=n.length);t<e;++t)n[t]=i;return n},He=function(n,i,t,e){if(C.prototype.copyWithin)return C.prototype.copyWithin.call(n,i,t,e);for((t==null||t<0)&&(t=0),(e==null||e>n.length)&&(e=n.length);t<e;)n[i++]=n[t++];};var be=["invalid zstd data","window size too large (>2046MB)","invalid block type","FSE accuracy too high","match distance too far back","unexpected EOF"],R=function(n,i,t){var e=new Error(i||be[n]);if(e.code=n,Error.captureStackTrace&&Error.captureStackTrace(e,R),!t)throw e;return e},Xr=function(n,i,t){for(var e=0,o=0;e<t;++e)o|=n[i++]<<(e<<3);return o},we=function(n,i){return (n[i]|n[i+1]<<8|n[i+2]<<16|n[i+3]<<24)>>>0},We=function(n,i){var t=n[0]|n[1]<<8|n[2]<<16;if(t==3126568&&n[3]==253){var e=n[4],o=e>>5&1,_=e>>2&1,p=e&3,u=e>>6;e&8&&R(0);var y=6-o,h=p==3?4:p,L=Xr(n,y,h);y+=h;var d=u?1<<u:o,W=Xr(n,y,d)+(u==1&&256),b=W;if(!o){var q=1<<10+(n[5]>>3);b=q+(q>>3)*(n[5]&7);}b>2145386496&&R(1);var c=new C((i==1?W||b:i?0:b)+12);return c[0]=1,c[4]=4,c[8]=8,{b:y+d,y:0,l:0,d:L,w:i&&i!=1?i:c.subarray(12),e:b,o:new yr(c.buffer,0,3),u:W,c:_,m:Math.min(131072,b)}}else if((t>>4|n[3]<<20)==25481893)return we(n,4)+8;R(0);},nr=function(n){for(var i=0;1<<i<=n;++i);return i-1},cr=function(n,i,t){var e=(i<<3)+4,o=(n[i]&15)+5;o>t&&R(3);for(var _=1<<o,p=_,u=-1,y=-1,h=-1,L=_,d=new ge(512+(_<<2)),W=new he(d,0,256),b=new lr(d,0,256),q=new lr(d,512,_),c=512+(_<<1),w=new C(d,c,_),S=new C(d,c+_);u<255&&p>0;){var Z=nr(p+1),M=e>>3,O=(1<<Z+1)-1,Y=(n[M]|n[M+1]<<8|n[M+2]<<16)>>(e&7)&O,f=(1<<Z)-1,U=O-p-1,z=Y&f;if(z<U?(e+=Z,Y=z):(e+=Z+1,Y>f&&(Y-=U)),W[++u]=--Y,Y==-1?(p+=Y,w[--L]=u):p-=Y,!Y)do{var N=e>>3;y=(n[N]|n[N+1]<<8)>>(e&7)&3,e+=2,u+=y;}while(y==3)}(u>255||p)&&R(0);for(var k=0,F=(_>>1)+(_>>3)+3,J=_-1,x=0;x<=u;++x){var g=W[x];if(g<1){b[x]=-g;continue}for(h=0;h<g;++h){w[k]=x;do k=k+F&J;while(k>=L)}}for(k&&R(0),h=0;h<_;++h){var m=b[w[h]]++,V=S[h]=o-nr(m);q[h]=(m<<V)-_;}return [e+7>>3,{b:o,s:w,n:S,t:q}]},Me=function(n,i){var t=0,e=-1,o=new C(292),_=n[i],p=o.subarray(0,256),u=o.subarray(256,268),y=new lr(o.buffer,268);if(_<128){var h=cr(n,i+1,6),L=h[0],d=h[1];i+=_;var W=L<<3,b=n[i];b||R(0);for(var q=0,c=0,w=d.b,S=w,Z=(++i<<3)-8+nr(b);Z-=w,!(Z<W);){var M=Z>>3;if(q+=(n[M]|n[M+1]<<8)>>(Z&7)&(1<<w)-1,p[++e]=d.s[q],Z-=S,Z<W)break;M=Z>>3,c+=(n[M]|n[M+1]<<8)>>(Z&7)&(1<<S)-1,p[++e]=d.s[c],w=d.n[q],q=d.t[q],S=d.n[c],c=d.t[c];}++e>255&&R(0);}else {for(e=_-127;t<e;t+=2){var O=n[++i];p[t]=O>>4,p[t+1]=O&15;}++i;}var Y=0;for(t=0;t<e;++t){var f=p[t];f>11&&R(0),Y+=f&&1<<f-1;}var U=nr(Y)+1,z=1<<U,N=z-Y;for(N&N-1&&R(0),p[e++]=nr(N)+1,t=0;t<e;++t){var f=p[t];++u[p[t]=f&&U+1-f];}var k=new C(z<<1),F=k.subarray(0,z),J=k.subarray(z);for(y[U]=0,t=U;t>0;--t){var x=y[t];vr(J,t,x,y[t-1]=x+u[t]*(1<<U-t));}for(y[0]!=z&&R(0),t=0;t<e;++t){var g=p[t];if(g){var m=y[g];vr(F,t,m,y[g]=m+(1<<U-g));}}return [i,{n:J,b:U,s:F}]},Te=cr(new C([81,16,99,140,49,198,24,99,12,33,196,24,99,102,102,134,70,146,4]),0,6)[1],Ee=cr(new C([33,20,196,24,99,140,33,132,16,66,8,33,132,16,66,8,33,68,68,68,68,68,68,68,68,36,9]),0,6)[1],Ce=cr(new C([32,132,16,66,102,70,68,68,68,68,36,73,2]),0,5)[1],Kr=function(n,i){for(var t=n.length,e=new yr(t),o=0;o<t;++o)e[o]=i,i+=1<<n[o];return e},Tr=new C(new yr([0,0,0,0,16843009,50528770,134678020,202050057,269422093]).buffer,0,36),Ye=Kr(Tr,0),Er=new C(new yr([0,0,0,0,0,0,0,0,16843009,50528770,117769220,185207048,252579084,16]).buffer,0,53),Re=Kr(Er,3),pr=function(n,i,t){var e=n.length,o=i.length,_=n[e-1],p=(1<<t.b)-1,u=-t.b;_||R(0);for(var y=0,h=t.b,L=(e<<3)-8+nr(_)-h,d=-1;L>u&&d<o;){var W=L>>3,b=(n[W]|n[W+1]<<8|n[W+2]<<16)>>(L&7);y=(y<<h|b)&p,i[++d]=t.s[y],L-=h=t.n[y];}(L!=u||d+1!=o)&&R(0);},Le=function(n,i,t){var e=6,o=i.length,_=o+3>>2,p=_<<1,u=_+p;pr(n.subarray(e,e+=n[0]|n[1]<<8),i.subarray(0,_),t),pr(n.subarray(e,e+=n[2]|n[3]<<8),i.subarray(_,p),t),pr(n.subarray(e,e+=n[4]|n[5]<<8),i.subarray(p,u),t),pr(n.subarray(e),i.subarray(u),t);},qe=function(n,i,t){var e,o=i.b,_=n[o],p=_>>1&3;i.l=_&1;var u=_>>3|n[o+1]<<5|n[o+2]<<13,y=(o+=3)+u;if(p==1)return o>=n.length?void 0:(i.b=o+1,t?(vr(t,n[o],i.y,i.y+=u),t):vr(new C(u),n[o]));if(!(y>n.length)){if(p==0)return i.b=y,t?(t.set(n.subarray(o,y),i.y),i.y+=u,t):Mr(n,o,y);if(p==2){var h=n[o],L=h&3,d=h>>2&3,W=h>>4,b=0,q=0;L<2?d&1?W|=n[++o]<<4|(d&2&&n[++o]<<12):W=h>>3:(q=d,d<2?(W|=(n[++o]&63)<<4,b=n[o]>>6|n[++o]<<2):d==2?(W|=n[++o]<<4|(n[++o]&3)<<12,b=n[o]>>2|n[++o]<<6):(W|=n[++o]<<4|(n[++o]&63)<<12,b=n[o]>>6|n[++o]<<2|n[++o]<<10)),++o;var c=t?t.subarray(i.y,i.y+i.m):new C(i.m),w=c.length-W;if(L==0)c.set(n.subarray(o,o+=W),w);else if(L==1)vr(c,n[o++],w);else {var S=i.h;if(L==2){var Z=Me(n,o);b+=o-(o=Z[0]),i.h=S=Z[1];}else S||R(0);(q?Le:pr)(n.subarray(o,o+=b),c.subarray(w),S);}var M=n[o++];if(M){M==255?M=(n[o++]|n[o++]<<8)+32512:M>127&&(M=M-128<<8|n[o++]);var O=n[o++];O&3&&R(0);for(var Y=[Ee,Ce,Te],f=2;f>-1;--f){var U=O>>(f<<1)+2&3;if(U==1){var z=new C([0,0,n[o++]]);Y[f]={s:z.subarray(2,3),n:z.subarray(0,1),t:new lr(z.buffer,0,1),b:0};}else U==2?(e=cr(n,o,9-(f&1)),o=e[0],Y[f]=e[1]):U==3&&(i.t||R(0),Y[f]=i.t[f]);}var N=i.t=Y,k=N[0],F=N[1],J=N[2],x=n[y-1];x||R(0);var g=(y<<3)-8+nr(x)-J.b,m=g>>3,V=0,ir=(n[m]|n[m+1]<<8)>>(g&7)&(1<<J.b)-1;m=(g-=F.b)>>3;var tr=(n[m]|n[m+1]<<8)>>(g&7)&(1<<F.b)-1;m=(g-=k.b)>>3;var I=(n[m]|n[m+1]<<8)>>(g&7)&(1<<k.b)-1;for(++M;--M;){var j=J.s[ir],K=J.n[ir],or=k.s[I],sr=k.n[I],ar=F.s[tr],ur=F.n[tr];m=(g-=ar)>>3;var _r=1<<ar,$=_r+((n[m]|n[m+1]<<8|n[m+2]<<16|n[m+3]<<24)>>>(g&7)&_r-1);m=(g-=Er[or])>>3;var A=Re[or]+((n[m]|n[m+1]<<8|n[m+2]<<16)>>(g&7)&(1<<Er[or])-1);m=(g-=Tr[j])>>3;var D=Ye[j]+((n[m]|n[m+1]<<8|n[m+2]<<16)>>(g&7)&(1<<Tr[j])-1);if(m=(g-=K)>>3,ir=J.t[ir]+((n[m]|n[m+1]<<8)>>(g&7)&(1<<K)-1),m=(g-=sr)>>3,I=k.t[I]+((n[m]|n[m+1]<<8)>>(g&7)&(1<<sr)-1),m=(g-=ur)>>3,tr=F.t[tr]+((n[m]|n[m+1]<<8)>>(g&7)&(1<<ur)-1),$>3)i.o[2]=i.o[1],i.o[1]=i.o[0],i.o[0]=$-=3;else {var rr=$-(D!=0);rr?($=rr==3?i.o[0]-1:i.o[rr],rr>1&&(i.o[2]=i.o[1]),i.o[1]=i.o[0],i.o[0]=$):$=i.o[0];}for(var f=0;f<D;++f)c[V+f]=c[w+f];V+=D,w+=D;var er=V-$;if(er<0){var B=-er,gr=i.e+er;B>A&&(B=A);for(var f=0;f<B;++f)c[V+f]=i.w[gr+f];V+=B,A-=B,er=0;}for(var f=0;f<A;++f)c[V+f]=c[er+f];V+=A;}if(V!=w)for(;w<c.length;)c[V++]=c[w++];else V=c.length;t?i.y+=V:c=Mr(c,0,V);}else if(t){if(i.y+=W,w)for(var f=0;f<W;++f)c[f]=c[w+f];}else w&&(c=Mr(c,w));return i.b=y,c}R(2);}},Ze=function(n,i){if(n.length==1)return n[0];for(var t=new C(i),e=0,o=0;e<n.length;++e){var _=n[e];t.set(_,o),o+=_.length;}return t};function Br(n,i){for(var t=[],e=+!i,o=0,_=0;n.length;){var p=We(n,e||i);if(typeof p=="object"){for(e?(i=null,p.w.length==p.u&&(t.push(i=p.w),_+=p.u)):(t.push(i),p.e=0);!p.l;){var u=qe(n,p,i);u||R(5),i?p.e=p.y:(t.push(u),_+=u.length,He(p.w,0,u.length),p.w.set(u,p.w.length-u.length));}o=p.b+p.c*4;}else o=p;n=n.subarray(o);}return Ze(t,_)}var ke=(()=>{typeof document<"u"?document.currentScript?.src:void 0;return function(i={}){var t,e=i,o,_,p=new Promise((r,a)=>{o=r,_=a;}),u=Object.assign({},e),y="";function h(r){return y+r}var L;console.log.bind(console);var b=console.error.bind(console);Object.assign(e,u),u=null;var q=e.wasmBinary,c,w=false;var M;function k(){var r=c.buffer;e.HEAP8=new Int8Array(r),e.HEAP16=new Int16Array(r),e.HEAPU8=M=new Uint8Array(r),e.HEAPU16=new Uint16Array(r),e.HEAP32=new Int32Array(r),e.HEAPU32=new Uint32Array(r),e.HEAPF32=new Float32Array(r),e.HEAPF64=new Float64Array(r);}var F=[],J=[],x=[];function m(){hr(F);}function V(){hr(J);}function ir(){hr(x);}function tr(r){J.unshift(r);}var I=0,K=null;function or(r){I++;}function sr(r){if(I--,I==0&&(K)){var a=K;K=null,a();}}function ar(r){r="Aborted("+r+")",b(r),w=true,r+=". Build with -sASSERTIONS for more info.";var a=new WebAssembly.RuntimeError(r);throw _(a),a}var ur="data:application/octet-stream;base64,",_r=r=>r.startsWith(ur),$=r=>r.startsWith("file://");function A(){var r="zstdlib.wasm";return _r(r)?r:h(r)}var D;function rr(r){if(r==D&&q)return new Uint8Array(q);throw "both async and sync fetching of the wasm failed"}function er(r){return q?Promise.resolve().then(()=>rr(r)):L(r).then(a=>new Uint8Array(a),()=>rr(r))}function B(r,a,s){return er(r).then(v=>WebAssembly.instantiate(v,a)).then(s,v=>{b(`failed to asynchronously prepare wasm: ${v}`),ar(v);})}function gr(r,a,s,v){return !r&&typeof WebAssembly.instantiateStreaming=="function"&&!_r(a)&&!$(a)&&typeof fetch=="function"?fetch(a,{credentials:"same-origin"}).then(H=>{var X=WebAssembly.instantiateStreaming(H,s);return X.then(v,function(P){return b(`wasm streaming compile failed: ${P}`),b("falling back to ArrayBuffer instantiation"),B(a,s,v)})}):B(a,s,v)}function ne(){return {a:ve}}function ie(){var r=ne();function a(v,H){return E=v.exports,c=E.c,k(),tr(E.d),sr(),E}or();function s(v){a(v.instance);}return D||(D=A()),gr(q,D,r,s).catch(_),{}}var hr=r=>{for(;r.length>0;)r.shift()(e);},te=(r,a,s)=>M.copyWithin(r,a,a+s),oe=()=>2147483648,Rr=(r,a)=>Math.ceil(r/a)*a,ae=r=>{var a=c.buffer,s=(r-a.byteLength+65535)/65536;try{return c.grow(s),k(),1}catch{}},_e=r=>{var a=M.length;r>>>=0;var s=oe();if(r>s)return  false;for(var v=1;v<=4;v*=2){var H=a*(1+.2/v);H=Math.min(H,r+100663296);var X=Math.min(s,Rr(Math.max(r,H),65536)),P=ae(X);if(P)return  true}return  false},Lr=typeof TextDecoder<"u"?new TextDecoder:void 0,pe=(r,a,s)=>{for(var v=a+s,H=a;r[H]&&!(H>=v);)++H;if(H-a>16&&r.buffer&&Lr)return Lr.decode(r.subarray(a,H));for(var X="";a<H;){var P=r[a++];if(!(P&128)){X+=String.fromCharCode(P);continue}var Wr=r[a++]&63;if((P&224)==192){X+=String.fromCharCode((P&31)<<6|Wr);continue}var Dr=r[a++]&63;if((P&240)==224?P=(P&15)<<12|Wr<<6|Dr:P=(P&7)<<18|Wr<<12|Dr<<6|r[a++]&63,P<65536)X+=String.fromCharCode(P);else {var Gr=P-65536;X+=String.fromCharCode(55296|Gr>>10,56320|Gr&1023);}}return X},Hr=(r,a)=>r?pe(M,r,a):"",ve={b:te,a:_e},E=ie();e._webidl_free=r=>(e._webidl_free=E.e)(r);e._webidl_malloc=r=>(e._webidl_malloc=E.f)(r);var qr=e._emscripten_bind_VoidPtr___destroy___0=r=>(qr=e._emscripten_bind_VoidPtr___destroy___0=E.g)(r),Zr=e._emscripten_bind_zstd_version_0=()=>(Zr=e._emscripten_bind_zstd_version_0=E.h)(),kr=e._emscripten_bind_zstd_malloc_1=r=>(kr=e._emscripten_bind_zstd_malloc_1=E.i)(r),Ur=e._emscripten_bind_zstd_free_1=r=>(Ur=e._emscripten_bind_zstd_free_1=E.j)(r),Vr=e._emscripten_bind_zstd_compress_5=(r,a,s,v,H)=>(Vr=e._emscripten_bind_zstd_compress_5=E.k)(r,a,s,v,H),Pr=e._emscripten_bind_zstd_decompress_4=(r,a,s,v)=>(Pr=e._emscripten_bind_zstd_decompress_4=E.l)(r,a,s,v),Sr=e._emscripten_bind_zstd_getFrameContentSize_2=(r,a)=>(Sr=e._emscripten_bind_zstd_getFrameContentSize_2=E.m)(r,a),zr=e._emscripten_bind_zstd_findFrameCompressedSize_2=(r,a)=>(zr=e._emscripten_bind_zstd_findFrameCompressedSize_2=E.n)(r,a),Jr=e._emscripten_bind_zstd_compressBound_1=r=>(Jr=e._emscripten_bind_zstd_compressBound_1=E.o)(r),xr=e._emscripten_bind_zstd_isError_1=r=>(xr=e._emscripten_bind_zstd_isError_1=E.p)(r),Nr=e._emscripten_bind_zstd_getErrorName_1=r=>(Nr=e._emscripten_bind_zstd_getErrorName_1=E.q)(r),Fr=e._emscripten_bind_zstd_minCLevel_0=()=>(Fr=e._emscripten_bind_zstd_minCLevel_0=E.r)(),Qr=e._emscripten_bind_zstd_maxCLevel_0=()=>(Qr=e._emscripten_bind_zstd_maxCLevel_0=E.s)(),Or=e._emscripten_bind_zstd_defaultCLevel_0=()=>(Or=e._emscripten_bind_zstd_defaultCLevel_0=E.t)(),Ir=e._emscripten_bind_zstd___destroy___0=r=>(Ir=e._emscripten_bind_zstd___destroy___0=E.u)(r);e.UTF8ToString=Hr;var mr;K=function r(){mr||$r(),mr||(K=r);};function $r(){if(I>0||(m(),I>0))return;function r(){mr||(mr=true,e.calledRun=true,!w&&(V(),o(e),ir()));}r();}$r();function Q(){}Q.prototype=Object.create(Q.prototype),Q.prototype.constructor=Q,Q.prototype.__class__=Q,Q.__cache__={},e.WrapperObject=Q;function br(r){return (r||Q).__cache__}e.getCache=br;function wr(r,a){var s=br(a),v=s[r];return v||(v=Object.create((a||Q).prototype),v.ptr=r,s[r]=v)}e.wrapPointer=wr;function ue(r,a){return wr(r.ptr,a)}e.castObject=ue,e.NULL=wr(0);function me(r){if(!r.__destroy__)throw "Error: Cannot destroy object. (Did you create it yourself?)";r.__destroy__(),delete br(r.__class__)[r.ptr];}e.destroy=me;function le(r,a){return r.ptr===a.ptr}e.compare=le;function ye(r){return r.ptr}e.getPointer=ye;function de(r){return r.__class__}e.getClass=de;function G(){throw "cannot construct a VoidPtr, no constructor in IDL"}G.prototype=Object.create(Q.prototype),G.prototype.constructor=G,G.prototype.__class__=G,G.__cache__={},e.VoidPtr=G,G.prototype.__destroy__=G.prototype.__destroy__=function(){var r=this.ptr;qr(r);};function l(){throw "cannot construct a zstd, no constructor in IDL"}return l.prototype=Object.create(Q.prototype),l.prototype.constructor=l,l.prototype.__class__=l,l.__cache__={},e.zstd=l,l.prototype.version=l.prototype.version=function(){return Hr(Zr())},l.prototype.malloc=l.prototype.malloc=function(r){return r&&typeof r=="object"&&(r=r.ptr),kr(r)},l.prototype.free=l.prototype.free=function(r){r&&typeof r=="object"&&(r=r.ptr),Ur(r);},l.prototype.compress=l.prototype.compress=function(r,a,s,v,H){return r&&typeof r=="object"&&(r=r.ptr),a&&typeof a=="object"&&(a=a.ptr),s&&typeof s=="object"&&(s=s.ptr),v&&typeof v=="object"&&(v=v.ptr),H&&typeof H=="object"&&(H=H.ptr),Vr(r,a,s,v,H)},l.prototype.decompress=l.prototype.decompress=function(r,a,s,v){return r&&typeof r=="object"&&(r=r.ptr),a&&typeof a=="object"&&(a=a.ptr),s&&typeof s=="object"&&(s=s.ptr),v&&typeof v=="object"&&(v=v.ptr),Pr(r,a,s,v)},l.prototype.getFrameContentSize=l.prototype.getFrameContentSize=function(r,a){return r&&typeof r=="object"&&(r=r.ptr),a&&typeof a=="object"&&(a=a.ptr),Sr(r,a)},l.prototype.findFrameCompressedSize=l.prototype.findFrameCompressedSize=function(r,a){return r&&typeof r=="object"&&(r=r.ptr),a&&typeof a=="object"&&(a=a.ptr),zr(r,a)},l.prototype.compressBound=l.prototype.compressBound=function(r){return r&&typeof r=="object"&&(r=r.ptr),Jr(r)},l.prototype.isError=l.prototype.isError=function(r){return r&&typeof r=="object"&&(r=r.ptr),xr(r)},l.prototype.getErrorName=l.prototype.getErrorName=function(r){return r&&typeof r=="object"&&(r=r.ptr),Hr(Nr(r))},l.prototype.minCLevel=l.prototype.minCLevel=function(){return Fr()},l.prototype.maxCLevel=l.prototype.maxCLevel=function(){return Qr()},l.prototype.defaultCLevel=l.prototype.defaultCLevel=function(){return Or()},l.prototype.__destroy__=l.prototype.__destroy__=function(){var r=this.ptr;Ir(r);},t=p,t}})(),jr=ke;var Ue='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';function Ve(n){let i=n.length,t=[],e=0,o=0,_=-1;for(let p=0;p<i;p++){let u=Ue.indexOf(n[p]);if(u!==-1)if(_<0)_=u;else {_+=u*91,e|=_<<o,o+=(_&8191)>88?13:14;do t.push(e&255),e>>=8,o-=8;while(o>7);_=-1;}}return _>-1&&t.push((e|_<<o)&255),new Uint8Array(t)}var Pe='v7#aSX_#XB5F1nR9TNyes1zXCkI[7rs~sh00_(4{%gR8xXu=/e,Pu_)8F+}nFLu7g!Jn6=GJsi+i(^cEkB``C62+8w?#EJh*SvBMA"fg*]^/JMAGADJA1EElQgnUF2(`hp^t4fW=Or.aXZCx{nA@QZNXR=QZagp0yI)`sU(m%KB4I!!Hg!R*tC%0koQ{y0SVKS*{2mNQY;hhc%(%C/HPh.VAk@YY^TukX{qsk$T0*m.N"P2;wqYpF|DrantTE~zpc6@ghqN5aL_]e:B4~Y@]}2ShC+ne4j%7X6",)/Ok,375bHp(y;*fc3cuqI&3g*&1piU+R|?,hW@q3{)zFbL8+dg*Q;U]+*8oHFTVzCvU,$,q59au4e:g_]+*4<AO?hJJA/$BT(%I(bkS.*L2y;F%[m%eK!vE$~3^YvRgkp26y;YY_T;]E+ew[VVnJ#|Ha=YZN1~./{bz*)a6nVusRkG(nFqIR?UkW.3m^pR|8ioZ`):c7=fuQ@Vz)&:d@9k(DWN_ZW|%pTR`a=q$GHx[GcOKT=T1Q;I#*Mx(0w,xneON?VT>.T7Un:&bDm#cq3B{KLC51`a=;quUoTH.~d60+#xz>7Q{:$,qw&@fYDYC.JVFnZlrz=X[e:Y*c3I{;_+]7>*`P5`GHF4T;|09Ts76>bG<;*t[&On&@LUpxD[SwNLps=jV0$T0rNb^<X+Ix&@L`u=]J2d+~8]KibbRheI4)tOXG[5gnkW}^$8u7=L[hhE[jpt=C!Ro,>uorG).&>)B,*d+i%V<J2eOW+.]xqmT=iOn+dFB{z`|1`GW#c993^%o1ep@NXmLbU+QQCYZI]#VERG]7?>W;nCjf@Qy*vh84QP:&bU0v0SAZ3+.)%5gWr0}(3LOLsDO>gB@nk$mL1l[Po{>?]XuTdCA?NsbcA(b=p|Z"`a{0qXSEf+6@v#HDAWyCYP?Tb!:[()PiOroXN]r`b4+#CMo4Xw%sF>2Gg;#V_E=c,8~i8DdkqU9~qYPSnWnDPoR}&!NXH`uDdXJKn=;e($|X=a<WMZv:9*YC>oJ/k6cE$t%R`bwO<)Gs;@V]rnPS0a`QzFHfojo~[eyB=eMs%W6b$ky0<F@NKz+:g!C0ln?,f[5B@HyZjdOA_"<mSz7]/j*%:H9pDeN7p#qxe`<BPu`@TO]v!gv(rQXvT]{_a6>xw:n!WZWR[HtLzu,QyI9Mn=OL~BnEJ!orgOr@hOrw5m_/s#d]&cTo{op/T~SE^@mut/baixgv)Fl#d~V$%Uga=eBOCagIZA(jJ~.s&`r(O2oNMv)H%Y&op)tRY<%+o?qZK.kPg;#s_fQI]oT=]FfWqo9TMDeR7PVS/{kGdhhe_%W}`)ic)W5w%lw|Ou7B<2TZ/6p`Y7OH6g=@#(1q9YvM@LWPgvE|2NoG1PxdflX<p]T62uBN:zQ>p:_"@@Z>r.q7a/9?x8,F/&;Z_;I%qnwyVw=/_@.0L"qs*e&YR59pv|/)?Sr~[)6B=E,r^j;LsOQ7R?**`,pE:t3_T8/Hl{pb5yh.lJ8Fw"G$V6?GP5uUkgKT=[l47Pkm7,JL8GI.!F2_i)e:B|3mrH.=KEwp;@iagwx:{>qr|wrN9?xDczf5^Jhb=@=KM!w7b$!!hn}T+IhD}[lH)b$){NMPhRux$ac5VX[4TlV2Fg[2|)`p[`Vhqukm}3j}.6J<T.l5n<lac"+uIs2>7x)GHr)k?GnM{E}fuJbNXv{W]WnRUgu/q%^C6%77U"%oB<="0,lX@7du9e%^nPoNS1{<mzp[;NK/{F%k78U8{RgUp|<+c>=]kw<5VdRu`[(pc@Nk^)?^K;8[w*={`?=z7>=Sk{h@`t89Y5c9;MLG9L@R_]Dk5x&>]"u>bn8%ePV;<zQr[=U4,&`!&&Ua?r:oykF>qUyRk.]`6+`^`.{$[>/TXiirVFJuQ/Y<cZz,U#//qG[NPK)6L`9zqFxrgp5^+`%:55zu~.P@AP?kZzdJ=FD#g402pPX3I%`n3&U^_VlExVEZvVg7IB@`p&iDx4^FN9^<T6rlD)UNy"ulr8Z@lc=w]knl}Y=1|wrp;zT{#;;52+tEb4e{rj#L82?:G,3,`O%[|)3^Qv2R9.=@:C[<:.hLS.Ld&@y5NP;2)%>bWl.$DtkxgCrV]X6$qgpjtRIJ>|<RL~vi_A2cdlOaYC!KSsdE.tY3V7GL0n{j((.];07?Lr9.lG.0ggVrNNT+hchV;lYXRxgk5F{!.H%CsJOmYU]^qf1/kMM+M,P+`7n9K_.d>^;Yn.TA<}1[mY;$9EJ&;]e{;vz;CFHUB>@XK5r7absgaF{/e24]y^.<`I8~hwV%F`Na?Mn^.&;5=eJ5m&P3V[w%~Tpnko~d$DT|]M^:mi<e(IS2scp&jo~;{,By4c0_P)XkJ<{3Z$[yyQUgL9%_*IMjvI*wLM+e5/VV&3MCEb(NuurmT;9xw5"B&U;5^v:jVoF$l"l2sv!WRq[grq?t[>%Gv/c8oZ)r.3L~9H>Y<0_,!E;qr|aIiW()Vq?i!l>{"Pq^}/v^g;R^CG@GPeuxX)EM##)F>w_:Fe$JWX/>c0_YY_$Ihs0IM<[0e{*HMqmz}m::ci?d9=u5,3OV=YZJrE%skn(Yh"<_mK3w&_#yMQ&Gv_%!.Me[$?q;nd;[4Syv}!Hn{L@BE``$h&J~.uv>3@`*e8.Lae_g3u*7>@/t$#dL+D}6,>%;@ZFY!M_t^NZH|Z<4xzJHLx}uK<{Rke4jw}<_L`m~@^nW6X=VYpKb7`|b1Ep%>:ZghZ_$pi]iB={6$LgoVu$S0c=+v/_sTQ7[w"A6^gKOZ>^;%p/mUEQL9;{.2Y0wG.!Y`AdN,Uc[x6,8=r/:krE={e#Fy2L"92z9pC`<`Zp=vU=d/SUsulr>(qvK2aCQv|f4HcnMWvNOKz}AoMW?skp|a{U5"1{K2%6f{7^EF24J82T7?FYb^LB8/s&:)1qx0~@z>+ljIGn=+[&Kf%%SRUQ~^EqC`dSZp~;@(:)~.1qoZ#&:fZ>2)e_x0J>>q@K4`D~[=MnPX__Ok$EKfS*;i%K7,jbfs/[vT&d1}C>4;E/z.9C0erlH43b^H*pPI"J_g_>}}d3v?v[5}OX|OY1(`yKmqV|84^qpVVhophc=3XQcxbvFJmiZ9WF~zc%svuYm?r[<H6^?Tq^cu{Y8.TxY0LL8{}=GP"E4E#>uq7,bQV%x*wP*x$nb8Z`])VM`DZKImW+0ndnv8+bC=>G/74l.VF(w=<?h>>b6[@_6vmrDU,P?%|D~ts+f6WF5o}Eup){"0`[!Xjvurptm1^S&m,Si>0ep@14XQ_YT_jG1^o_YY&Wuen_M;$o,S}<+nS<WO*E/]k<*D/_|.@f%}(wTLYCUC?%t"xy]QL>Yde"E/YLL>^cwwwF4_YsswE|exbsdzE/,TGLNTH4D!wFg]@XE(ol0}E$Dc)`KeIzFJOy2r[uH[SJ24pq?cOJ1;MeptJ&6j;FaWb^e_tT{#bg$xdum>krkpa>krOXn4,z`hAxZq5>~m:#liBq|oY(0B,i@h>=A#?a/}gx~.wz#}n?o8%?FnN^euDnz?L[=U&m$3YgJae$GH&?KS0s()}^ELL>1pv;+c`<9@u`o#DJVnHSsQ;cH,<@9@psu^0e"5tY0|~Hm=H8kj3V%q(365=#n$"Sj/Q{d11m^mOeKzewCjR>S[*p[CQeu7J91M#wp2+^x0a@Q?C!:ntO?s3}s.6=xQS=^qq&)3m?mzDRqnEYZqtJL%B)}Dug:]@2C?IC3QV*fT*TG)pECk_U@JF?cC%SJ9{xwnx)"BqsbP[JO?.C6XS]c8k=I?8C1WqKT9snnu"L?3V[*TM)qF?tya[J">?B9O^#$^wnaulK$_&6+T~(0D[n?zk=H?)CaX!O$m/a;PW"?].6fZe9t.CZiD9=r/MoUua:q.LG4Pf9*kFUoN40o.oD/M4olXKD8gj/+"O#9f5n)er,9=f/l3)FtXV[{uxP8goS#nBXNB?25GIW~*H[%$=;%$<TZl!lJ1(JQ;u[L1"HcUP%rPR9nn`n1f7/+5@#O}d38;P3Yp2.y%GZy7N0aUyvb2uGeU!7E,nGW)MH=oHe>O~J&F1y)Ff`$o=m0NGNj]0S5guG|ZyGw0Kg,a30XbDNo7#!xUAIJ6ymI:gX_CPKO?LDv7WB7J!26JR=h=Z{gOgPDv5+=wQ]fx[RU5`gQT=gQz@[9Hw)u%eMLk69%lq5/YU_kSiPOo2H>w(/M_fx_Y.ec@TJnSU&V3EJ^#L[+"S<7f:]Vf[MALF{pz8ot?+xfy"?+x!Ffe+mwCsyFPh$hy/0{8`SKx[7W8u*%8+dKdk@{dSmON90d<p2r$*$*]"K=z7W&Z|0]2ZiKk6mo^q$HFQ]/6`ycNw!ALPg}=PF1?=K)X!Q3]<TkVO96mCv<TIp^YU;Z}kD$Vf@W%5hz$2H66wVMgyfQ<ysto!t?.:e/:EjJ#L^i&3%&1g9Xrr+09Upa,=`y0#RA9>AVkKb:x}:=O8WB~1KF2r$vo,c~o5$P*mJcO}%a0BzFyYs99H6"/+n}]%lZWgR@fo[Gnws1;0ePoU@wyUp6ix`}^)iOyeA=C"=_,NE8/:egxX5BRP1MCnV[m3]Cy7+7x<PXx:p:q4SWZ.Tf04g[xF`l^SC]j|!d?S:u:3"D#O[k6<Smf;[ZE8ja5%P/GRm7o1#Fvj6f+qxJMq!q!?nq!cUj/`E~KU!5zLaiLc<~R`+0.48]O>0gUg,m09kf?*%=JoS#n,FvvsFyn5z=wQF$K]n$A6Nsl{,X,`#}@5g"(Nk`arO%2%U`2hqD#=)NBcQg;U5T^I,9z6gge:mOhzTl:!!<;&ZNv8&}K`H!#Kmw=dy);]mV2`VL2}px0o0zzXhv%rml<<T!nWiE%7/vgO})87XmI_)vp{>[xkZOO=^3jC0WklyQNu7T1D8Ugcc7aO<xm)O~z5z"Hyji?;X{,_Dar<,l8@#YaJTx;zjhm;||560ok|Z~<fhK[x!ZL:H6Af+XyiR0jp{?]vs!*Rf1cuUH[}r?#^TJaAQozDd~k}O,+oNul2.?e[C1bc:XE.<%.}E]5I0LNl<chd,V,v0^hLg+#XYvOO*7/LaO~vp5.E]j{^T*i&6}MGdOSX[KqE6C&gelBFCz|@>RBk$wT7o9w?5p)S@s)8]e+C!@/FuPmQ@,e8.~j,UD/?la=P+}ZexV5.fUDbjaLLS,*}TXkxx{nu.FJ]?"2LS2.^ckQd$DJ]TdeSrEjI_@Zn=LAE3hf50^23&P8@uhW77/fDS)D.j,TAPr$V?hx<7#O,Zq.<:XomIzzJP5ozMp{2/BPT1@6OC>g`ho9I<x`zHJIW(?LQ;mZ]5lfm7nf1|`w{K%PU1^+LFyg~h1%ZR8BDacce14,c&DDEm@>(X5b)MAL7Lv!JF<yLjt1+ag+[Zw+uFWzNhsurvhG<y,Xj=Nok@qO!Z[Vm}"F|hYt$M7LQD]V9RUK2qBxd7#K0LVE]yr?6ls?r]u)[{^#?JRtu:cyAx@UFodiHF%Y?bT])M)$^2H*GW4&JYxXFvw#F{0vi3E~wRDPO$M!b:jygjAH$ZsSNsFH:n!exx$IWg#b7&Au%qM3)dnkH5):!lR8Nak41YEr&Z/+y?#|:M([vh|0{q&ZDpe$NX_H?oQ#Rp,>Qh{iCfzD3]V`UbI1h9=r(f!:M4O4m}:Gb@x$oacY3QC;per$;db2,lHp%UJEshk[aYW[dc_5TbkQaRb0kpo4cYm`:Q/Ts`7,p$e1ff?g0;0^1Q&|(=O<_6A8v]Q57ckcm#fxO!YN}![maE@S(fk:)~$aL*vevSTEI~CmbN!V`h$)rmW@u*/=}]_]C/U1UM=i%x;S]cPGgxU*vbF*)it`Lehjtoa{[#!]Mu?1rl/Zmjk&16V8X3v&OP;?rX<hN9&t|UBv=l9cR>[r$]]m5<>S~i}0Jdv*caC=73RGyl[q=0y)h3XPBP~0jj4ud)+gERI}L]Yn,SVPV7FN0;0=Qh8G@o[>[ZYek[)ZEd(%GI7,+0iNG]*iSWEp]8s3:.L^!bL{813,.V1{~ZXS~,%S8:InihEJ|3I]Mu^;GPLYMnmR}%QObh)lEV4H1CHf/:R+B7u|y!$q>3e;cR1+GPRfpI}guCCFuvup1dpU#)l?zduJ^(&x6y.l,(D)HTnJ~H~cMavOH6Y0.!x.8|u.JMj{Acb^US@K|gC*E25m;j^x7i1?khy3?fX{QI(g50Y+){Y!`SJ9%oP_`b0`KuEbqv8VR=_N4hcIr[,]d,Sk66N^Mu3Cz4,zzC5<f@B0&%byW:^cDbYF&xh&@L$*;!]Q@goI>Dam5*?6a^s:+=d9(+[.=9xDeNP*]d5.Z_NhV&|ue@2m5*|ub;pI[Cz%%E@pC<J}BixJ^nb=G[#bZ<#cLz+^<:>ZcMcti=yp(jI0v*aaC=i:yp/5|GvQG@DX:xHis,yi{q+u.kX*(@5FUT+fZX*OjVqFVs?m(6~u]D}AY/X![Vm,;[=P?DO:NfROI.lqI2|qF}DS*n%#G>5qGI}of]t9W%#`0CCFXECyXAn0K@3Q<;f@@X]x)S".q$4nc{_OAxQZAs_<w=}<~.d]s#T(Fr[;h17zA_;H?8:wt./8;3(p;e0<PS~24VhHLkgdq3#Im{Keu7Asu:{fa/]#?[c)]d5.%%]o]b_}>J5r8,V&o${SKBYu$s3!N@>bQ=nk~XRozM^@Q5<=mC@o7^e9|]YYqxwuY&_z*LY/VM8+ZYp{T:PC>q5#ro>?r:2IteD,frn$30TyI*9jOu<w+i..9]G%nV78,@ZU8UBj9!qqZfQ5:ta%Gi/f1pu*SCerI]3NCCiO0Q|XS6wa}fkp&A9&fn){I^H=aj}!haT~r.<T:rV]+~M6y2ur|aC_H42v_%F8B>n*v:i^H|k>&rj.UM&af)`<&#xKkx;Y23`+Y@5lQG;S[PO9/Ye=4J#:>IUn5&Ubx?.?6pMDc#DpMMyWN:^q^m+`x%<39PA+vU(2q%Xag;Aq:Tf)<T:czM+4E5w)1YT!f:EL1VmdqR53|`q2;rT_@#u;A6]#|N#!~bAay$I3iv;gMQD<BOi0v~l)AF(>t&AxCq2E=iyu0_XGN,i?>qk8@#O}t;Z(^iUrYZv>3~3l>lnC}5xp3o_$Ta0Phrpy*b6OULH6x6)5ny1m(cK@MnDpx;)i)ln!xY"Hsj<l+25,tqa,?PisQ<vT&3eu~f}ZTLL_,9!*w%fm?m@(&)~.QJjOsq.2s?U}WZ"{6/#9;|Khl#Fyy4|iPsw$M}jp`:);0X5PJ|L&9*nV[$@#6|){~`:r[%ta!K^#t;g>VY(06>|:A8)lBqtmH|KSBVBV5$}<>=Rlm(BK,y?o"J~^Uv3E9v@6$nNOUf7Y5.u/vNfAj`]6r;qlHzzf!FokMP5u4242!pj}MU9Nc`AaJ)k%|PL)Ex*rujX+U~)DUT/0((Ahp_v$&dy/SU+u*rxq=|WF"X3<7$nTE.:Lv3yjr,^wY}>mGLJKqX%&,YHXp/oSaK]YOuJb+cD&:5K85+[T9fy4$kMM*fm/Dq1t;kmfKNt:tyFJ8dk>]0(I(25m;E,9}+F~CEz&/{NO5Voc])VzE&~.P5L_;=f7D_;=Cykc@w?LukW0YpF|aE{9Z=.wLOXn,w;jv8/Rxqtq+Xi`|.C_ac%[^!St^m!:3I?h=gMPk@9,GHRM5]Ou@4xw^=Ok*/emOu:8)wLOiQz08a0<U;lS0c)6%gy7S>sv;n_{Qy0<C=d6l4RQ?mGL)L&BP)n+nUyGOS.3LZ#M(=]kp%x*VQ,tJm*/1xo$UJf<t5iNR$$:;k6i)`*/Qwiy1LIy:.vCg/R_FqJKWXGHa`l[ONy.`#a0^0:s:q7l`2N$/{.c>5V_KhDP1QWr|+R?GPx+Em"nlOn~,B3F4kIPu#@/UNa7?9gfq>]UUnk[Ooe!?KPwc%"8{)a17_<#`L@|)GOr|<7=VY2b(=#%H1Ug(G<qxm&Y0XTsYywe(lVm8CE,K|$Sm]&`QqS1o[D&ip1=l}6^$_sKXF~idv6Vw=GVk.}KlrIiYra,b;Ld.E3FW)E&+}M_0;;U|2T>Kp9^Iv@")l}lUM*pTf$M?%2f8&l{+HS~IXn4`pZal$ZHqsdu.v7!Z_2|nd`^9gE@loqCV}Eok?%<[Eli=<Lo}Pg]wSEI;3qKQ<lr~9,[N=L+#?Wwlr>a!.!PY$ghv$XI@hUng|VGl/YY1=@Pmr#:dQJ_:s!jdv)tUrkq`2E=bu.Owj;NJ_/s()`.%{nG_u*Lt4kFqgA^``=sI9Enu,Q[P=^19V*!59TW<pY%P*wH;c0IhqT}Z$QO4vrmM>gFAm.9hDx[G*Bj_`YG]#|Koo#bcZMWyl4`w]i{}&@OCW/]H_e6NKN:MPhca3X_Z*ak_O*U>9K(pTQk}qC[e?$Y/]Xz:n(B#>o[.nb[B/^$H0Y+!b1$G9T.YvNw&j4odr;^o9r_bzft63;Y[2>I:KFOk!>I#bZss:zQq[orL1oQFOOgnE<$N`l?#T;#oq0$XqyK4)J.}/}Wx_Xlj:O]y@w}/%{y:u@_k.6Vn>cdsF>BWluknwNe~.m|7i87h;7|^l>dI~^$_bnNCf38CvP6qk^8x0K8@u^82V7j:}s:QtE/mqr/5KTV_yOc7[H_exxyM@S|X{Z+5"xyS+YCI+.T*:]ksw/&(%rNAWRksy78IM1O=b*O$]nkR|^m*`0.9h;YJ#lybT#TZE&MwqbXgG:m,aBj2I8=TV#*fGb^,/75Gzro6z~Av+FI.4LV;<@n;x+*:@hR,xoHF*5OaAp_?_Gow|}>ju~;p"AYbLz|8R{>bDEw[D=m3`P:Q;n![CT`g.I%Y#CRdj+]@HIn=.e[>Wy1Y%3fDdb1*rKA,j<D%PoxZ@p!k{ZVDgRk6WrmoNh%EQnH~iv[p!Ce8P"`#i}8Zf!*Rrf!d3IM^U^Uw7[|C4=feUH4%vAr0}0o69H4vg,xGLC3~#$J(x0fw2Lh/{_4V+kr9%b[f5ZED[2<t1>zv{gypSy4Z/UBOB"zv+8,cb[awy#w8<QZ@unYEUroD.M1)qUQ.P8d6zvi%Z!/?c6utM6U?7}`vhtmuIx6KS/TvYI0rn^JMY#ji&5f<.;?^6jRh&)29f/07uK2/"IMIQORCi04F`BRQgIetHtCq[5@6FrTQcGLZgc[@X0;6Vsqi$J~pg^b=779pSx7hy#]E;JslqVchBD;(<+2uXKJGY_}NnwaEo]&ff$RyINOzbr{#%QO1z{87>K>Y+dxYRYa7qC!,TIBO:FipTIBvX[c|TXRUM!q%ef>?,XK3otO<3%!}2*i7c);;T;t>b9aYGY~QQ][MyZ*d&)2?J=y:5=g7l:T|wgjJ#~3,FB[&oV9j<|PojN*5tb6bkJQHWFXG.<7Q3ufU[)Xo~rI@VIorQjpmnKyWG|YgS;nt.XKLS;3_[d@D%;+K)V$WOd"7pZXq4]QQQx0vxP:i`8n8Yb^q[V.@VasDL!D4k<?AQp$wO,:;q/6+c;]W+{#a7R6MWL:s*"qn1taGz({PXXO@G|w)UR3F"1Cnie(nVv$%IJ1[H&pzJ=v|P`M"EHmlC04*g6){[zWSHJ:0YD}og1f%!i1sYFQ0xU9YqOwsu>bKx+ft,0Y!VLS{y0<gD+;x>L_SD7)(xOI.kBDag*0y`ZVN&.6c[Uf;Y2iv3qv9LM[.Da:q3kdBV!JB^d9P)!=~lmyJ<w(#Kuh=+7{s+Ct(.MaPdb1MOeY[2s5&_=~|y"]4?>Wd;#vXR.ic$hyNQjZL.U2o#QCm5WBm5B,ZV"~{4bpbn]<@(0Tnw8=3*?harfk*xT!^gNte#e!1QcLnSz4iHo9TIeQ&3hPE_Sz^]lv>b.WLSdRoClRQ@7*!0qN=]!0:9BR;Rzsto#U6XJ@9vfyI*B+R[.rG,|BVn4c)8)%q3hLzZnf9nlrDRGiNR?Hi8>1#o98AwwMa.<hJJOvVk~QQa{t.7fxRT~y#7mm$qoGr[G<0/"D>nDLGU]P=<kszbH%LZ{_G+i.+URJDRctCCW:E:_<dUc[O7L<G/R.O7^}AjaOQbB8LN0?#FXJ}Z2BHH18&b08h>US=Uc[Y0X0P3*NdKIUDO.+wevOLSvnFNde%z,nLZ>`E:T5XzKeLN.={ZDNH6!*J"x%+S=;@VaW^iHo[)dvaY,!)Wq!]MW!7LtE:)>MW:EzK:S.va!;YMgj]+#zr0,d%8]QMUU!?nSUxz`#7vI0XfmQUb^TXfTT7oe0naRzvgT18e7LFic<PDDK6Q/bt|Cllvpz?5:u1)OgAdkQU?"cq>#NvmY0oR<lR|7q:;Z=:<[Gg]Oyd$,*Is6i]>&`,eyfoC@V}VNzRu>3~KE[{w>K4g[2}fpO:ZvOH6H3b%H3(R]=*+3i(rr.9=Gn]xQ8D*x%WUE^ndO9Xib?9*BRI9~+~R|IT=(Mk$RHv`np&%Jp"33mHSZ?AU0vgP+0O<MRtxGW,tIk!gM,>:(*c&:xk3{XwK.T058].!XQxa_!*3Vh{wzV[!CeANohR@?(V7dNt+Z>nG&GiMl9WrBx55!P,9iqWu#C,dHde1ma/jre`Fv,RrLaV8n`x#=f0]ZO1Y7cy7PhZ,r$2q"GPNL8(*c2C]CeLu2ZJ;maSkA1KL7o!o)4W3kp0Jd@tlG}IUO5XY1cY!Bz*Z]c.N&:$O1@~kl)rDm7}0X5;nm@Aj]MMa`8`fy/IdD4Ui]q@yc&;RS^/4+9G^?,|8w%,3?IP,095VjxGkkm77(/R5Go&!h8N0.8qO7aU5@*/p&qfkO_lfKFKE=|@>p5U=lPq~,_>M7:azeU@ydpm:s3upI}AR,x$K^U7g:YZ^w.NU3@g0kd1bdUa[H3boR,#O/6P36oy.NU2jHaE:x=ipsow?zjrR1q@1N^<brOWP577d"F)y,GH^iG+M<1Nb.eMrMaLS$Yz/}/y=7+*|/[/G{dBkpD[@?r#V%xooJ#]**%ci$ZC^+n!y<x@yO[^6)]uF6N;qPs#yVeGz+q$)dRBRky<HvC{Ka<EgN{pTzo&;qx6uxOQ3seBr[M@7r;rp+8xSNeAS*664d_!&[?:/G6;zyqR{_,GnA=h<S6<ogNaTS3sx@gK`bynSGJY7<|*Du15$MdeU)ZKgN6JaDbI:)@so7@H3G2RJ.hH`CR&8013)9%UGn+tigf{F$jpo$zaNx)X%@gnQ^I(o1#_CflH<Jdbta2Nb8=1Ke<Y@rX"XB5^SXfxOsfrO0#b[,vtlziA?*xH6f+Nl1#&VBl}81WnF{h*WAMLwY@>WBwwo<Tse,HN.OG<#QFMf?UUj$u`6RSsviYEDWZ.v~8k96R@#L5PbXY$by|C6/NgeRJiq"i:|<))C#O7&;=EIa[{m%6y17:,,X@ZEt1v%epXU]vKp<DcHrFvg(VxR(!BzkY%Z,Y4uU#1waN]c(sUX9j?/aN?!uwd,JZdrb2WKd17S/w;?Q@1K4Zz<I,D!H[MY@=b*RdF)WaF<D]*d1Qs$lf<LAP58CK$[lZ9RZCt1W$,Z?SW:ohta#RV.dUN.*#2K>MC8c6klS5aIBfYXK:}+7%0}YYQXyI#CW%/R.|$SVCd&:9R>2y&XDe^FUI$Mb;h>~:=SB8AeCy;OeKFU}Q7LiV9yC4=DuH!<R;E6!u!GHx{cP3P5KSHq;niYmi4lw?C=Fs3&V_*52UXa7qF1dFIG.ZN18&<gt3p;lN=15DnH4adyG^Gf3$vL(k_l6efi"p+dY)L9l#Y~svuYZ:^%fE9v^[gbu{5^(2@3S~@8A5h!;)?Tg8&n~|b1N!AE|$x*+=5;8`i%s[n(29yU&>.Jl6o>Nf%@NQm;54el"o[+H#l>FNMn2B:t7q4$(.tqD_wwW$A+?0zZpat6ub"v;$W6V>lVvwPd:)ehibc%`v>@1QRYf)s%wgeX<8aRL"F;s3@P_T{#5%4=(NQ3{l2.$fylP)f0jvf9~E<%w*tUW]7433&Uwia9nBr9M*d%TNUQO:YnFs@H5$|jh374>Nz{Aqd%{9[qA5@|){raxvZy?LZ?6.?Tw5fmJI|$`Bg|(K&phat^*([HCqzfgk2T+:2@8c+0H1e$%p*V<Hc1r8;RAH$l4rychkB4HwT$e7Wge{~x[=!gX5lvEprY@=L&Ax~f.kGq+KRo]UMgL=@3SO2Y<xN?psfq*2;4B>@3%<o[ZMOxU3B4Oi<_pUUQD`[#5m21(&/XgK`U=nfqH^2M}{C@Ae|83{Ae|83{Ae{Poz}kl3B;taY206H3(Z>#Y2Z>MWG:}MQbuHnKpobuS&*o6ql;,!W`Sn@TIxIz|^A9z!+B}%7w/:,H<%hF7d"dnCmN!/kMSzsV8aMuup#!TMF&bp,cGZF<q7(2"dy.dUmTt]bb~MoT50X&M@$/2/zuU;.d7wbN7i3Ny1S~W=c,JEC#.[M}.CVg7wC$X{z#pPA/MdK!^O#C`2pd%d*f=4:q=vGTsS6=d9mHF<(4U}A$Qg!v9H2%LgCln27o9bC3nf~0Av_N=00iu]^+qb<K.ggrQrN9;@7279k}ueUr.."72H>H+Y[wm&l[Wp`mG2"x&3u08^1wyV{7+^W{2QN3IB&3q$n@~8d&%Evot/9ixg|YAxq.f:6265c!&3#h(Gc|Gdn{z]Mos276^g:|Z=&fr{0M^%?(4$GHtG^YY`;;WdM#xkr=!t)/Nh$.Rd;:&4(?"&Q`M2K_weN,.zr7?dou*fnG*5Va.T&b~"`Xmo5)jDC#jV=0Oe+l)j}7+qYpZr}7M[LtL_wTmpzCChA`:R~wntrC&og`[^Oh5yu;`@EWW7f@drvMz2EMtjr3^lm|h^m!%t%2I#Sco$E*:RyNrUTbHRb=MQN7O(v?Wsy)v)wO|.R{WelTopgy(9_H}CgiB[Y:@VE[>?TSkB>q2Q3o2.F|>qUW43BS]D1LMRcC;,:cGF%{W]0@F@fU;]W^Gu}4}BV$l`>{Uq5.0KsxZ"|an`l[xo+dlf0QWRn#JIq_GUa?CwgFn#`k2+Zq_X<GBYb@G;&YFXy?S>eM_x+`D"^gR"T@4K%$DJ$T)A)BHO;BAM5gA.)NMHKvFA7ptA]UC#:nw=GdGBnF8g~y!ItYJLQ#IZ?[]Q2m3v(rf4u!)~R+8G(oU>DM7?qy{5iXxgU=@OqrhGNez/z;v5KVs.8gtzk:DDM@6OGiZmYuJA7nfDkUh&2nc+FsC6SqE$k9>xc[6o{2Hs5^*NE)Ukw~YasbqWhF]zYVIposqbTLrcP+!=pZ?,HoBV1e4jI+#Tt=T&oXe[^m301BEawz[aOD/VT``>W$SA8GYg@2<?Z*hO%oDmb.v)A[ctlOy@#TMQk.ecg"<V]r!}?La0u7&qN6V|BK]:Ctr)GJ2Q$^a"F"p"u?<,1Q*T=&IBd5&K@:>?x01Prq*`S28w<`*#46$$.D0Mf*|BiOx|pxT}sws[?V6?a**YL".*&tx(+l<>UW2hz(bYAQjV<@uV&wIZ"hIobTj**gq.b*+}W&qg:H6]`F?.pJEAH|V97uK.C~u%4zM.~A6zQc3Hecxb8,/;My>/rH1{w]HH[vM`vl2kh?DtJPGeoI0<rHVuRzUt@4+t?nH]B9p.+_SZXuK8x*vj)UR1JO";hFOXEEDv7f.5]lt"JGddd8u[h]"$9U/]+>MuNA0OIShC_EiT3Uw33^9*K~q3dxQ2+>)IDs+#YOL#kCjnU+*_ksW[=^5o_kKC./wDWS~a|FS#H[q%FqT[}|tIjCC!M`f<tp+yX9h&<@ET@gMWO?}zRzRS@2J@J%ip`Kj$pj@>i/N>c6kx>LF`E_vIx}sYeEDEp]Ij$==V49+l+21U]VWE9Lv;>!j?0)W8rNV9AQ/M;T%K_l17DctO8vK!DcNO?TspS~M=G(Xo+`H(Wkgb0sb.p>KHl;(^P+MV,YnV}6~?xw,ZYLCktGVFY26nzaMBy*k^YbR"u3?V&ore5VHYN`x=)Il}~$/Q9k6TcP8a2kR[^s5`)f4d$fK)L#Xg<F7&r:9[!oMWK:I}S)>4]kw<66/qM)`6UDi&B`H4<#xQX7NJEwtP"v^@;mSwG+nw^_XlnhSGH4z/RVE[p>iGE|,GC*Zep=QU[of_+*Cw^%>l~+:.CzZ,CGNu?Z%JYa&2n6V&*!W+Rhf?;4vU<iz*9CnM?3yFMW{IJ?XSn!TX0GGL{Z.@5MfwQLYs!UWkZaqv_=N6EqSf:?BO%Og8TBP9WH`p.?l[`8X`$qwlt._#"#"cm>K<5`L@!k;@fmT,b(wnhPDndZu8`i:Z>*>.$h^G4$>.>HwHA!A&p8tz_#8}V&0r<s0_O91w4c$>vPo?P|.2v{xpHzuTX[V>#|4aS_C!%D4o,DbH!?#T95TH@AOVX*dx7MO?L#jC7Y}7qR@qKW/8P#;)FG5ldueMs8+1)UHICT$V_pE:Q:=sJ<"5iiyQMDIh}cjxy6}zG89Mog~[8AfqCVdPvf1PCX2Y"j]I=Pc.U+;kt#exvD%K5aWT=aw|#|qqmvF4Z9+/]^d3ppog(j2{R&IgD</PW>+lMfa1=IcHnVu$a%H04<Qn>^:ug6kFx!F:n`j9pK#GnV~P8^6A!:~%K"D2zqX(G(L2!)k%Ssf95Y}/^q_Wl.fh>U;"Bmv8@${5,ONi{5/.[{(bf/{.Th=%OP33+^""%`OCs@}:5l1Q3Q=vB$Kf&S~(O<b*9rX8_H<R5otO~kc0c&bX"HF]iRC@<[q$@ma(lrE%Re=8x%r.g!uwT[5/wrGV%4[W&Od7;/UP^UUEi_,KP:4^^obuh5yrhpMd["85]H]mi3q.LdbiIk3&^.!U+;7ot3|1M%Ma&Z[m2.T9BH<eGy:l{cLgadBPEHBssKG9,cR6>1&;QOut5cY#B45T(%?uAGZ<Ofb`!_FzGImH[H3Y[SPG(2MXNO%+]KWeXw<mFYT}<9Q"GhFJ)0<]$#Zs~f4e<X$Eu24VN9gh/8.M<`It50%gF9GrjtE8boxUKIJfj{SJMTqYv^gYa(jUs"?Lg1{{(]Y=yCgh3Hc/oph]p4)`[@48j9h)fVRx9uNOHhGYj>Fi6JcgMa8G)nYq7q15G>dXwx4ivO".{|*PW{)o4qbHZw:n*`x~3C=;{/TfS|&v57GH]CM?Vio0QYT$o(O|YwO?1aEhg1MO7%5h`B;[iw>(I>h,gmr2hu<!N|[wDf*&s?`hk%lrHSE_(fiyP3<hQ=o{t$<g3|AVLqC&s[umjY^!Dea@+n":`6te<`>WNH1wL_"ADIH65Nv1g3N{n9E:aer{o{~[wi~gOdHQsm_f"cB!>NNMdm&_7I0iaQz*5myutrT7gf:2!Yo$p=Z5C&$Jgkm$}PH|%b.kMBgig&sef<d.K&e!a^}3+?j`wq@nG!M;&]jrv;mM!7n?{$8+QP@n6qF.;.tyF%j+ps]HD0%vu7d:E/8uthawDpOx%nE<ZW3>NW[,uhfS?wMnjm`0JP1OW[Be_juZR(7QNY2?o8RsZRDY_T3)K.Z)l`M4n:Kn2%Hnwo$mv{(7@mE<m=u8p!@VW7`2}#7T[Co2K_5m!SH4v0ZrIjVz!8!i%q;meX$QNYT}wR>La$Fr}Z"du9Hp.2Y5adoVp/)*9[Ecy`>[o0v98l|uBu7O_}yEQ]:|<9AV>tV`o7QQI]`2#gO:[T@q;n#V7TPL>(Ks^e(2ypdjxwb(.Bz%/+o3uXQRF&k~!AP1<o?lp%s{14c0Q"WhA>FoCPi5[[|2+h~8+h,3@1fsXNwEWvKsk*#JL~;J<sueGuTs}:E?$gM#ey^}u&87wF9.*`H*g#9}?)?n?qw;iM_`xV2b|17XF/%[j#.Ub2)6]`P>5fTd.lIXLSiJih$%Tpdit/LF>vjJ}P>pHdWroDNMLwikJ0Wk_T(TzE*^2M+]*ik$}4+=|=M;[l:pxey%FGxUWD{3z:?5})@(Rv^dgG,r]!Okz3e.3rvEzP&XZ1]iMWVK7pOf7;m!yVSk_HWkv<Wk[$W9)t=+kgy+J!)o^2z:LFpYb7H*e17vUNF%Ok}g[zIos8`BG88oj7&]MO<u%;Vyw!TeR"^oVl$x;zpv<@"%wL,C?#Sp%.#!?;SHInZ@:c%&zU>Lp]R5"Zm9phR7bHG(z$y0CYVb*e{*dR.I?v8/CW$n_{|Y*<<?dp,C?#Zs7f:jm4M0CV.<j5^R&$o"K@GPu.cz8yIaSaMEY)+F9y&tgI=LR$x4`u4V:k8.wyl:C5L#>)p{k.91e.4o]6A*K[:+2Wb%|(DF}w<(aT)o<H@R)l6ch5?ZVIH}`p1Pu8d`x;R$4+VbPkwY(qGc3v)tbm?pf`l`O:[T:jrV?:TW"?YvK.k7t5L`]ksja<nV^[Su%i4Xup^.x90)`.]D$V)[/gj`0!pV0;U>Ut*`_HrxzJ+rl`of]w)UCkTU!0Zdd+T+S[uoI{7=7TXSz<160pV6a:$%qd8o|XeH4CUq"WB>3y6[w}~tjp.k$x_Cm{1=r*Ksx5:.*g6PN>@14mKpGc%`=Tn`f6L8^$.4vA&8rYv^jt:30<Ixq.YD[Uc[33{.))*cU^BeB8,w*2m}ve,_p||Hc%Si^UKJ@av}_q?%jF7[U1$dk.Sk{]NK!1d%xY)|OI;O[H)`eh6?pqx)Q$5q:9g*gF4,bUV?aYNOQaG+7)jq,QwM)2@(J5VU<_m`|xL3yakpSP*qGo2k6i}2yaS#=fM#V<=v,lf5sgQ1;#Z1ut72rY)`I$SHLoPq]1Tg2&wR1i5iWh=&7iR/e_Kb_p"eNqSF#R{^7T7dfO"|BgvIIA1`sf:hk?H#&`Qs4>9cact32q8[Fb|;p@{3FG|wAgIq&3]PM>^8+?y9Cw?qX*B9C/$p&w4h|#&#T#$JgKHUz*kT4Qa5;H5Y>[&`z?#dDb|;6N+o1t6`Ou_N#s|nV>63?.JWXp,xY.]Ky$2+l%0s;ma%n2AF7SOGVB^M6C`^Zqv@0+7)61i^g!NN_2~:GZE^?Uy#65mHtSp&q[Mjx(NTC|qqE%{ozaGrs^r:jJP#>*Sm<LDgG*7,dUi*O,I!;+?6Y0DdZrpxFJf1l`z$C+;/B{R3>z)|6Uw`;S5,e,%$X]lJWV@TWv#RSm%ugw{MK6sEBkj5SB,hEIBt;C_JxZOiGUyg+CUA:A`cif/Y6Ylaj@)crLg5Ew.Lmu5F=iu6gMGXBA;%A)N?n#VtR06&|ziKwFolc!)JPKh,I,9YdX~K`l*{u,|80_kNhs2Z&5)?e,CK>5&B9S>UWBsELMy+()|^/md$$CJ@L$#N!ax=T8i~AMxCS;uKAEk!T(ts56DsHDHwHGaOw*ll{}6QB3pvpq|kF=g^mX!YoWF.#{Fw;@~fpw`bQZShDoL2/hp@zr~I9KUTi/}GY8XXFqo$a{g72k,:^M=TB@O<g)"4sru3qp=vj;}9Zi<L,)IT28=!!5z"G]Pwgc)8/g$LErlt!LP?ejXQ"UN?K#4P(?fV^~=y0ixpS9gD"mKsFWW8v%Aea3kU`WDj6#sm"h^X"m:29v6[IX.Kx+JY1I/o^D+j,(Zze^benUR:Dzs.~opqhc(&w(3gJL=llu3y5%vp,K2g9eq]j["Sn<]"7p2zDi+(iotnQ)0RNRq_$Vn{nG)ut[M;Fg@g]ZCgM,BdN$/N/ood3(ptBf<HyZ5I1:[X,X(Q8ITs`,hRQ$/fr^lVj1T|rth9u=?0vcOu.66h8/;B+vw)Er,U8~a=|3K&#PF(1h9G%G+1mUhr76S{GXn0Swy]GKo^ts7)M]y9^JJxH]nm`d*<Q<;^0#<(/]qkH:?,7K.Rd}[b2;^e]$UqAi~u,G"/(Ha|[l2X"0zmjn}qdq*Tq/NV:$>s.<@bCv%*iS|<a_(vXxV";>a%H#LH?x?C?%o9,@%JC3mjN}Ge#R+$g,S;HZ[I@SO]{2!GNS1D#yAW&o~+b4WJcd7Y*yvqV25.9U+itG0"Av5WU&5]#}7sY6${uzg!@biNypwtaD+FQ,B6}_9:F~2`{6*kiiWhd$TsnnjOUJ5~*{vN2Ln()@F({[84XCnenH&)2jmVdb@>k`i1<pBjC7?f]oLGq@aC9KihN("}1u$:~99U[^;Q9cg".U_yo,V2usX@M]S.3_xa]O[1t`$)a$dq!^*eh&?}uJ00v,85O>;QICx?~ROX;2lWOtG&~jrGWEu1%p+8#bM9[c2P#4#mL#u?kQB,f"=o`([ig<61eO(5pI%*"gIy/X<ryMC4/q=v0d:l=N!8uR}4)vwI9+*QKIQQdrHoF%7Nf2Y!{8_1"Q5yNcsG(>l5j}Z{}JUKmw*QEbts[h9oyq_a&r{:"{V8PT$`"F=9F9D|%KmZ)T;CmXYiylB)4cF@w??lj*FI>prbaHX{,%Z{b,(KK$eQ8y/sA=>"ll_hU^HF:F%7=LlV`A*]$yu/_[@P<or+QDLCC"oY0KN|Sf]$&FbgT<8$d>D~:_U:@KS90xObbgxHu84{O.eb9h.EdPXeehx}:|}%>L66r9d,3naplotVNueC.DE#ggCy_<C_W/E95p=[Tf<^7"PxY5+"Ir<H]QPfwx[i&}j1)G*:ca3k#_S.#XStc)B>[9)^j*JlxT,A_flkx_tfG]sjt+uQm]m/MJkc[r2iBaE6h0+JqkyvssEZU*{8qRs=JemA,swN_W[_Db`ML;PS$7_)!kQR+UV:t>#C;a,sD2Nsm,9P/no&NW1G>{hrF/dN`?>vTf/W>Zyz*Ki0aUs9)*KOu5mfOP_RXLb%PBb`zIt/A.{F^f~N!6u&L=U554^edY0RN=&WINr]|ORY,5k">7r{mJ4b^asoa^L)/~P0de]b"z`Fez>F(YS(H4oKOE+iH:2*Us6;!G0__K6L8J`[c@0rkTzo]IOe/dgl,Iy#$^_DZr0|F4OW4RY)<y~^^cCcN`k<e]lR?Vnji1)VZ?!w1yM_fq]=Jl4mZp~`hxTOA_l1K==}UwElx*"UdbrJs~ggmcPaG;Ey@shkoZWwhJT$0>s#+7`hw@cTJ9y11o_XnRbPp(7WPdJpD)K~)fBHk~Nkp^Rhp7MZuXv|0@*"`>ZE&E+#ThB>jc=N&QTJVcb*AJ}[gT<s+V5j8IB_698PQBT;{`x*G!RsFO+L)pS3}DFxe!Osj{)00}Ax1,Ha!EM<x!!0m{OT;<3(8~4YV26O8sUp(8}UG{(!/H0:CX7AN>YiW|(h,x?W;Cgobcu`bVFti9(]Am2#HSd?pH8$a<gK]}fGWe9)+>+f$%PklC<kI2kQIc4;,2Y~sM:~jqyv1r?zwY%Dgz24]")9Vr#&%a$`vhV#+SnGq1p?dSV]8*P)jkeo}m]ZeX4]99#=S]2@EO,PEe$;>bl^1AW=gtn9ZMor?JYy)h;_T7]rD{VE7:E(th64K`]ROwEyM(TUF9@fb6#{i0;m%_0<Ncn4SjZ81:h8cM/@F9>L+V9:6T()m]Mqy8Ziib%k&pVs@6a7mf*y%ONztjX,4qbI#a@=(UJTbaF+p~za=N98JqI!7oe$F4!4vvlrh,}Tc.Z`/3dhz/VMW!+zT8H}u^c9KfO?9Lk]AMn80*hk9,&JD")lcsW#8;k0f7>$A*nGAybQrWpNkW$m1"sN}E]5ig%&l92G$Io}Ld"L(q^XF5u"qD!Y"NyI1`R76(7+*#SBXCF1mCbT7Q/l!ae1U:b%7Qr$Zis}rs6cS$"8w=[HGYGbHxPT_lHkp)rt~:oSek*vkh!yJEQ!q5fgMB!{B9:GTV#T!>gR41M*T}YUykU!tiRK&qpd&9#lM1bW/TwCb]TMR("4".FFAox>UY~IYd=)#Bg(;vt3,{HNY7>Bd*g8?$g)$WEC#rOO3=S4`ISLTNcy21{h4r?EuFg[/0s*K|oj>vr8*V7X>ymv3bP=}yEg[)TOW;v`g4s]O%wVbD$mhrx*O2GQS{dc%?5s"S?ttbXvHRRUnw~MU$.fk3[EQaW/"t7LEJ>,BOMz7J<Atn_:wFaaxw4{/X~^gZ$8~tBD_Bc|<qUo<;pqoC1E@|%>n6!^Ws+ihG|cTzF*!HNDo}Zd&6}oaGsB<!h#,;vumP6+O#Pwr2^1&~%%584f1VNpcnCC}2z5C}b(Wq7vZ%GR,S<wvH5IM&p<{b2Y+lHJ5~>fS{6E3O&[OpHu[BAQZ3_XDI6=B54j>6@#,L]<1s"v]1lMX0H.M|4@xn}`]+q>3I8st3UTbXU!Qrp{[[fC*iI0~bmXaB|xTk<bXl;#MMc{$<)gN*jSGiCHbZSkt[Ag^.`bh;R|]5^n1+<+fEeIlH>C@g@I#zUd=GySJR9F9DQ$`A{$waNd(t;&iH1DF.D*!F027>sMsP12;Y+C9O"_@f`3vq[_?>>x`%TJ&6LqHnXf`X:Ag.^xP*,exa^@#5vi4is|<dq;*3wuBFYJJ1!O^H::vPZ(ho6=$bbs/)$d!,YbC,|frw)!AgMe(QCOm,Gtpy=fcaq,YXlX}CjxQNHl7yrk78$DNV`vwI~7n]MuUFGydq%tVN8Ytg#az^8ip2`Slb141,jO#h_$~ib3T*T6x$$uWZm>O.SeI>V^JB|`EzsdUmsN{~a?X3v5_qv,6hI=.q`H7n~:|1vxlx4gWNY%yCzod2P%3jhB]ZUjc826,&[2uIBE^ko<TUMoHt;{vKh]1r!8Wg4kS1{6dM_$o3UD_7tCpEdZ,NX(qxUO*;p^b@^VTNrupTfmZlV,K+(?B.[R4;JEwAlW315hxs4/]C|NzH?<q0[:KZuo2E%e(G3FH1)[Bmm|&hJe%x<$Cc7&J[E&X1X:,8&kp_]6w^Ymn5)3WlnOL|7Nqno16_FSR<5=I_)bUTvi51PiB"+Y,~E,6)N&#up$:`4kq6"QV!KN.P%81|<L5*:us5U!]#p~00{LC%d;Wr~7h;MT7e9.m*vD?DR>*r<65t*)</b2">x!t.b)d%s#^{KnS9sns{fccV9PqY,{NAk8},&IiyL4&fiJn~!Uy(%6^M!Hj7w#H|B%me=SPwJE&2$/zy?1Hksi&U=8T(Ab%aK4Wz18#gpETUWW@`(>RkdVd}z7F@0|#N^xI,5Rcl~7ea.gRnkv?K(YhQcf.".KcR9$t^G,P4V#pas%.>+t}yQKF0!4JPSH~Vyiq@tdrQTX9P0PgE(NT<Jiye<MMJ9%KlViI=a=`H3wVj35%!c"<W04g(dq<5)&1{?Pq1>E#q&Yv#i3L.1`y_8OTl#>rf^oj,K=^&^u"?n>0vIJz^4/*z!J!zUxk^=`p4VZ}yg}c!Sx_JP/tY3)8rv/9S1+)(n^,9:KQx&5q{z(KD<s8z?XwJ<L4;hb&JuI;_x1ZjFTNNzmx(%YvJ1#gC}Y@ImI{kNZ=*dAF8*A?#ZXF_S0oQ"Zk+;GlJ/&H#r8HKR/97bd@1Si^R,c#wAIf*4PF$c*g`C_w*s4}W;mc;D(>_*y<&&heRoz&]`>`+{qt*{P9DOR*,!uJsZ&se`+%Vz1e?@Z:`+i+co+CNW+mE&,{^|H^CgBP,o06S]2d43E6nEEvW4b@[#TY@i;w4)BKjh<)e2ric^u=6)5bV:zZ4ih*uipN(h&16x2*8eHH9se9SNmB>n>%o?*!|O$*4HFd|Z)TMMCG+!:sFeXCS%r3<<*&v4s7#L+os0DI)}[ZfMS",VMgT}r^<4!y]tC&f=+FnK,ts#%@cr@m[<w^Um39#_`t.z_hJG[GfZG89S}>.j1"Cq^+iKlf.[rmZ9ilP+p65A{00g>UKm2XMBN5}U46a=yJibSx6&*f**aYW$bncbX9YSBX97GAN}@8>z[Zjv*,JitS,Xg"Xq>jOXn;t0&~)?xY~lOQa@/o28ao8_5of$i1MYNvJ9/!Ya91w`Xg6bCi&Z0{;~5d=`U[4sm.t}su^o3#G,<y=?FT$sX[Hr;`KD!&fEQ|=VZsqGOp<QNO`k~y{Zl5R7;"aP=u%Tdpa7K4YRKhhVN`},NPwNzxx4$pcVRvk)(PU_$m^"pbuUV(V.W+/q|{6t6{*8=ST=oC%nj?Jex|VI=_Oefe1p*<DCf7_4U1MlfZmnG^6SgpsSJg<n<IQ%E>(^4X)@*UZqeM(2m,nJS[h|7U%+F[5g4DnHI_(c7iU(c*hcG&VSEN.LLLAXb_EXjWgD/g]S^|pVOu!3S9QS7Jkd75c)"BpbJB9GJIQ|+FGq6g(x$TcB|xCBilBaK)/xY"j_Ku<(X%f`v/R`_)QNPx|3,9Qu[yOkEcBw<^YT[;Tc8e~~3qEW.D3B?0}I.>81c#%]Yx[y$^&+[1=.jC`w=w8zPqRzeG,@eHE++S:&mO/dLEcJzXsIw_(uAl]$BXl{/Tjj]8LLW^[Vg?DsSM4vQpc3_`rz3ccKd5wc*0:I6^ac%L!;s7_w{~j66+J&:nX<T</!<A2uW#f}uH;F!$3NA?,gD}wZ4lIZ:!sv9lA7KcA9IZBPlfqc*X|!&1>LZ?zMn0p}j0Z=;8]h~v?x^37,iqq{_L?7y!rpHZDq#XNYhrLtg9"St_=sL5S;GQ)#`jHo8qo>XO(z[Di]YBr$H,DKJl6GJ`_kS;4wK*C?E]TY11g^9d8{D_gx5jjF`l}v0~Our`#PtF1B(,_qK/9DKLT{"~vmwF2j@9`NE*/y|2?SK[rb(KtfC#(}*Bg&lp#@8("PUTmca"_?CTNdIj]Mvv#rt>8,}ss$X!><y$R`1ou7^i2QvF5hxwythIBy8.0GB5l/fGk&(ey9,YF"STd}1X[_qDVk9|1wGcL}vZYvYk[b/`45g]2OJ$qo?=S&wuFJhcB4QZVJ6t_5a%40.7S|ZEHGB^,`R]/1JlOnz:EM.q16j^qTs0)^wCi]50vzk},CT@diG^]1)hQpJJF#`$ua?1EdDV9}%6`45Z8qK&r~bZ$5tGKya{nsC*([5bE:N!)3TTX@yrD0paLDE=ZX)_>cv;K1jttu,&I7(5^V!Yx"@US?`>]7vY5Ms7Wd{`gqmFS*;Ez_CQ[#MiV_vu92+UxG~t$z?[5}pn^W#fWby/^inW6RG+Squ(d8iSQ/e000SbG9HwHgjbM[{k&gPO2SBCIwwuB5!pZ10ll?*$j3w}p1nWzBO[nC9!(A"m2zj;gcESbVx$,@9|g,_fPS^gWH>wj69",Hl^M!ZB#<Q_jm+ZQq<96QcDwZXWsG#)Qn<jz_jIhKS94<U`dFnr^LKEEA}%?o:<i@Hpq"zm5j3[va.:lO!^:N|:)!JQ#V#KIrZ9u.g:cT_g=XVXyPosGT{1WR,"?iiz(z?fZ^cuDPv>fwa,[ur@p)G(/n7gCc3?cf?)c`oU)csU)Y5*z|Ym|gHV^"8ZlHJHId,frfr:l:`B[PCdD?VA@Ze}`Z!&(hbgC56XfQiyC}V<ukINfwRi=Zw2Pw:de$&c]^nVvgrBNwTtzzS,C#v/2Nxx[KYQC(i4B~S=V1(GD^ycnj,8:H%[!j/}l"DJ#}OxnU`XL!~@[f>Ih2$^Ub4Ln~1X`;Dz".E@Xr,B[p%aC>;BzNdA`|Ud}vl~7tfL32t}%T44:WKTs7)T(n[@9a[4U:_FlN.U4)2lL_Xp+?$^ENQKZ=sK.m09!{C_YE7d[`$9oU|+/&qX;.(kgQVmb:RpRQNJ;FoAqi,4J=uEYePCqJ5dp1JbNOP~s?cPjO5n/]W#IKf#LCM!r1dID<3>&]PX#.Mt5$dx_T&%YW#5Ik>ri_&ewj9pSwsp"5|oI+Y/M*sWDry;$}`Bs|C8/L!hHR`St<L#"P2q5+GawvML!r$K?$lnXsyvjQ`e#Y(IH~c3i5Z$#L/vIGo@LWZX;AraCN$,!Q7{2q7*x*vjuOWsOL%l?!4|!HSUn}vE)<|d};a1xyi$DTr<&!+l+8Okp%RK(8{vwf+SczOaDbP7Y!K;TgY@j}xqn,aRL0~m|CCW.s}^ffeGeG,v(I|=hP>pLb2N9eADY}Ou.JMzQ4EVb#3^u0q}J*RTv[1^"(*vyOl%NW*sP#Ieo=Qj,G!+7c]5NioQvFb/MoHeDg|OVcRG&ZMT(QP3@/P{qRtR?;)XQn$Hl|EfPYg<G,`ruG"R8erk^:[BV!(s>_@^$gLwEKzZ5@I]uL%unvPhdrPg1#gmS47Rf?]IP=k@h!3>nL%LL4#npzrx[(T%Qs[tr({dD?7W?x2n%C5"V}F,W{UGt?6aIyW1;c])K/(/Q,hcQu=8~]nnfTE?7o!816+G0U1|yZgt/?EZXm8Eeue@_ucAUcp&hzV)LaCEw9SvWK7QAFpGvG(K;CE=g$v6GBwE}{ZXmM&/]PL|M`)e%q`Bo.Y[$DuTM;6w<BRk;Lk:/m#EtyON9xB/f<i.Y670nhsiK]/<LMa>179/JOW._d1<J"kiZkWl(t:u0v81PJfQttcxdu{pRd)?$U/pd!/7.N9g88wd6}4v?c]iJyzyu~f~S=F$aacfZra0ZLJC>d{J(C<_;#|5*vdFeJSRl,CO[cb]9c0qT4~xs9~&DgLMb^z|b&7WdNJ69vgjF9Be){,9X!dqiP[/fjpfTqoKE0QH:8}y8loE`MzS(6J[K%2Q=+9|`|kpP:C29jDI,%2_mQ#F+NR_;UtD8l[<8>riK]?bhaR;yF(e{~c?y9hh=B{s84$,!W5[11qN.$}WeE8%t)B[P7Kb%YT.klH@?yK3t?Kt/2Hs_t_YN{LJ{uX6NS5rb.cEV|r|DQ}Bj^f4GU{%b_/;B5XD5BBs;+B1/1If:,ud]EB=hJPSo!RVZF4`Zl=!9Co~*RtWr>ew9v8/E$Z}![Z=C=[w1!:kLhys?(F{;&PJ2HSD`*ky/mGRCwU|JP3b1MF}xa*H1Lf,fG^AD&6O[:TnXPPSt%B36HmCN~T~XW|1IuDs@w2KJ:0`$G*zM"u?k2Kj87(Y~_1YzU.l2;WRwHI8"#W^(IBxCrzlMdzV=7qyZ8AP6#E(}kFNXrCdY$&pTqEP+.?;CYO$8.JBkJ8T|_f`%N[s/ms$S9xPFkL8%OqKIibD(JXKyJ;=.84?}O%c`IhMKH$Gj6E;g0GAT%MFW8`YtKgO{O4%(g3=>{IlQ8gexi{zCEnO_JH&o&y]A{C|bL01;J.ApMP&d.?><ZK"&D39@HO<.Qb[Z8Hu17*qZYUvK_8"*sf;YW?[Jkl>on(:%Y~NAn@^ClJ9W/J{cxSU83A1W$0%Ls$jw64ZBn#Ndw1H!YQiO}Fg28F0)x6]]L_0@Zoz<KV/".,kkhtw??Y98>hr&`3n23w5^@hBzt,r?*)`q#1=<#&EF^+"W(OZlwi?D"E!jC~jE&i<eZyN]./[wIeMT?3akO2b#tiXGaemS]>??@Dve@.^wujl$JBG="{p4niXIO(z<kZ8@,A0*cN00"?u15Gp}^5ii}3rfDUsO3DQ^Di%s6nY?.3mtA,z/?t]kEy&#(d}ygmw^@#3V%Hqj;pgMW8]PY637jh,W0|d#v9kOT]0zo31hq,EdLqiUBy)orr/xo0T0DNLeT6QjOzTJt?jyO0!gNB27BhxDuGHN8>tp*V?pT:>S^u8n(}E7L]Th_VH@^o]#zum/(6p$!/>vcj=xFOe2Li&Mju(g&i:gb[Xpp1m:;rdxoPtWXCJa{R4U]]J3eQ|ID=y)0Bw&T7!H.|OjbHdJ}$Di>e8HnFX,VC[)%}Kgm|R)$4aMfxv.UD{W^n6v0Rz&TvQ{+43`:4cE#}=wfAe|nqVxR<]5ta6eeRrMC+M%5)r)b<pJ,[})4.NxGbt[jT4W6_Yz%pv}q[VmK7pu#oIgUaDaH&Ts6lYX."$auum"F8:aoLxMk5Md0kNl~CnACftyUETN9""bJEn"aV~h#3sIIg2)Eupx3Mi_Xw_!Sh+?8T*l?apZ0WN<zlNEp4W`|G`vsJD."IC$_k4ULcSo(7rj7wo.0=c?~pTWThJ3/9@07i0QJtbBc<6t<4sH,I|!PtMuXs7bN~b;gy:M_Cair`O?.18<)<c$o+)F6(@Q_N702KB|Fv6aIh~Ag$itsMm1=>s4L/zhk[p#nUR||R$*(}![;d0U,UsIY{8Xlt^9d9~#xZz3&GBswD(:SETi5{^*}$b`&{C@MQQ:0hr&OuFrkr)$oC)SlUt@dzhh1K?"rm{XqDEer[[XWCDcE]>@_A`ePiL(s(aU@hFy%>.%X]d|(g}?(8I,sw:=2=rZY>"eos+8V<ez|Xna,VUEoGpu?DJ{DUkxfO`R2{X%;]"Za4mk0Rk`mr3wetMK#&]D]AcYT!t9DMSLm3pKPh((^|~gk?wtP^^%0rh!D2Dpb$Q1ZEr8/dC5JaE2yAGT>?e+@K&l,4XMY8K6m>&taneK4O#>x.YQ5Hs]izBIg!x[U#aUQhZ##Q<ytcYbGy{Ty^J[V3SBD+nHZZ}Q?~niG(M?MjjH8ug8P>rSx2#@Cc.b}#h4iNF{bt4{{%ME!cw3Op~<L.D}+6/(k9J+RzNPuuorBYzE&j75*GpLPlB*`b$jF$h~4iR.RJWSi]kNF45lxM;B~.uOcSpXlN6_Bm!ww4#`rU:*$t0HL+Y_2OwwD?5y8_Ja@:M;BTP2EwKY]M~[A7lmL59y/pYad4*jO_Sxh!oEl4r|<q)@uQ7N0w#q7O;r9:JlrjA2]Q@GE}{Np+U[t!S)k!y.@SACPcmjn2@`&|7[&:8S/+K]>sBEKM1w7Q/<QUQwH(dvz7$LfW{?e=%fA~aERD0^^$[DdicYw$kda0${_yR>P*Ovp>Kf3nVm?yS)<pUm)<pBE!Vy`e#}}n9?*Kq]n_Vfj4aRgO]R/:&W$RIiVNvMyraDJ(Evt]5|QS2"q%AB9Ac|Zfjv`H/ov1@HU)(U:cS;*Wq}6B<6N<b5P!g/Tmv{~(aQ[CHH~~Ykv2B$`5ilvF!(!O357l]HBDKO=+t)6)iR.z[L8K,T_`k*TVgZ9FdVYkv2B$`5ilNX*v%6=rXvPByI97X9tznbR]^t[KF"llWM$ais"XXSl<rd,/GSB)<2]Ep^Iy/yEj|$LKxS`VC@M^O>uZMgIku["Yj~C[9DEp}b?c[a2vethpj^=B){w_:tM$7;E%oirQKUC%_gtnIDh@%bQP?dV(T^;+2%EK:I1s}$Nll>xbJ_!hvZ>=,1OMN=v)#x($V:#nh}GI2FLN~LNn1+CD?p@ji6nk[FUl)$eSOE0U:%b}z1iS0vvt~K0r>p1VS;g#tvLz)qSFoDKeA@uD76Hq"^rV#~MPYG32WZ*:qn**k5"[WqDo5vK!mM(xl?>GD5<w_wC>yk[KBgvIZH46<JN"TR1v(Tx8^YW.Yer_P]seVk^z*{kteGnEHhO@o7dkE)"d]+3D|aFxVFx]t~|yiKLmkK%_]&._CS|!j<8Sn&$[Gu]">mT:|iL0pYm/Z|JuT,uJ*Py7}<@w~!B30Hj6x;B=FX~By4DcUa`2~AG$khJXS@J`=6z/piOJ!!zkk:kCY/@?t?9+8%@qcv6Q=EzD9.d#994x_ek*i<:oDyrPEYiWxk+nC1R!):c:Oa=s8z.&n3T"{qd=9F^5w=cShh,wz<g(9Ydu)^WK;D7B6zTJi3<;"hqh6NJbMd8^<UJ@_xP/:oE&|(SWR%]0<eb,rT*S)m8HTDz{E5$D$YfN4xI~G0=|.+tgkmdv*=%3Yn@|B=(Do&GLW^~nWd85dk>s52j:!_U|`?co**2nGfaBFw]}+H8[;;OZv&TC[yU1WE;=)8$JWmL]kxRk^emrK/sdD1FcoZkbn7Zs9t%/P4|Fo8r@~Uug[?D.MF+y/f`u91kTj^tkY7`De+A"<cjpSC];#;HSWS8K])/kqJV@Wp[PRaeMqhyc~Z@"fWR%vO(!$I9qh=5c@a0ilPNEs{:2qP8[JW<G@{rZ)?J[GQbb0`p|fnr]=ENW~vz.SoqH2,YC)26)uH7}kVR:p7Y]4:]uP}e_ur@XC.$dkD%C[p#BC)W7x9JiSB}7(pNx18:=(Sbe.TlKqv5(@Pxd%^W>P2S:}&,Po1wk3T]wlL%I9gYYEoW@`w95A*^jYfASbwmyo/oG/=#Rl{yog5G^tkj*=@$N}g1S_L3V+s:^u&#T`=7~1op%imRtH:g/i28]lpbHrxq_|+5^#2{IIJBok/]sEH`nG}Wov,rm<`KC>VOqp7UE~;u#<9~&nU{FM%bA|o"zt+SIs;/9`6VRx|EPwH&U284z4i+C;6[c$X?rmX"Bs:MXbgJ4Vc#bW/^W^7On50]QCmSW5cn)W.7eA!:7mT.X~Z{r.!n9NQgBufVh{Q3RdB@N"0fC7O@4~X*e$Cgzd(VHo5iTpi65=Cs%M3DoJqFCyM]PpKN&+f`<j&Qms|&{zB/:{/r{G>gd4DiZ4se]|.IUobz^$)X7a5EFbzP[#rX<TH3,Fa?L~OL?SR<Q;WdV*jUZ>#a}lzc8:+%CDXzi4I4_eR;`5LrM}KH[vB|]9$xC|{"3U#4exU{rfZiSF:a/e[[H~9sG|e>Tb.abO@*0nS?W3>U6M~3V_]jh0|gk*"[odyb&u)sm|mP3wiv/CGR=mww4hKIph)ntzPJmGtt=E@9]Mp.7LhH{SY@P1}:x#r&Gh"UnEQJ9qkW&<gs}[/h!g$^=GlRfX<aU11I??lk=`~fl71dfa86nflkJ@O+J&*VO/#)9w~f|aE$Y;7y;&)Qp=xPo.cmv~Z..^QLIh4qax|Z~bzmD6o*Bw9Wb;L,|l!jA_?;SK]&YtNF8r!T1&DO#9!0kAv+.%s"oHSF1fqBS@kGmb&HAh5[$Fu/.nM91be.6/ogdU6#pu7XcG7w6%gBIpQ4bDU9%HWI.p@^8feY~6T>Z>+#*:YB0}@o:dZt=pS<01TM?hC~oAC#>pw+Rm%4{0RS/HRL,"DORvV85yqEB]u"a*L0MmvRbrzNgTvY*vwl_>BC])p8#UB8Z#,lFmeA<`a^{~<2V@5Rd}^h=Zpkp1&CHEq&uyD5V6O5/ZJ]S7WL%`@s@$qp|<t@,AA$%$j",wnRVzUkiVJ&DAb(CK{WKHQj)BqI38m`?{TsL)316h>pb}}`P@*</PsJ19ZdN`Js..FgWTD^|?y[47UWSy!(14jSq[LSf+KpO=g|;&gN8T4.^Lex6!fY,o,gT`aU8ssRF67_l:EcPcymvg5,w``L2S@pqC#+c>GS/$/:lIw*4QD95}~A82a)y4PZYaX8%m@K&C74z[O*C.!Y&EX<CsmPa3mlIKkT8XU"qvoxr6Inv8Trrc*w/$Z<a:m+axH5Dg(K3JE/(P;^>2n/kmhiE8DXf|Nv=8]L*^3uYwZ2=2d<"@2nam8iCJxoI~>(B&wIe*q:x)CzZGFVrOrP.x4#bH0{"3bY8,S(^`Nz}##%R+ZoW~2>c$7sL=8]kzzgrnj8w&bFGv).1k$3%eidEJ56~Bm>~m)>)K_ejme4zpyDX,iWOz7vB;(P0yk7y>hAP0Xqac)a5IuNM=aY]Z1Z|(UzhzAQEg/qo6&),ViKl2jU.SQrZWf4]TpL3k]GXTPQqRM~gi;69ts?WS@J/tWmd;x1/:M&YXO#$^mK/|F.hI?"JlXWT#)#C^DJYd7}H>n$GMnn5FE"2jM@L$d`*A92*P;f?9X7Kww/H0EV)bsM+4:!:jlze~&~KC7kE`n<0|OEnpIR.[msA.RDjX/1[QbW4L`.qxDn9M/R=}I/B@#JhZ;1^Sq@U3ss2o_P?cicM)F7F&YI}j>xC<J+&?Ko7g6LQ|"@dO5;f{&?s42oK((+Id+GfD^2#*Y0|j6(8uhp!HT,Gl0@Tvn&WR1vbrk$(ul=`^TD!h0ALJO69Bo_qM(GZ;~Nm#xNrmPsc1xNd*V{)dS!4Q&"[fB}D{B_oKy?2]0?OF3y#nG0OtoB_2Q]"6ETl(e]oA,{122UqZ7}HAs4Ak^CYROr`4?1a(li4eKqeglvFK}C{iu8rJa`4r?GOoV.[,xes_tCw^C=Fl51s@,oVCB3I[8#4`%:R2n6!M9%iiPB,W7kk(i)s+pzm!RzzsV/8|Cr3S6/~,=IP=h6?=X"?o3OX5k:(k.qo8qF8E$}91478J%]O+(?fc?zHkdme[(~g.eyY5zmJ9MIuUKSMFS?V8uhdE;:[I^ma[uk3C3<9&"_0E4O}zdbC.sLdXKAbm.6"0@NWQfrkRw%tb1,PGSCISTz&V?7ycY$dl*0t+"w@FUH<I<U:t7@xQ)V!5928$oIY{WFc[HDJCx32r;+cy!U$._]NAjzT+taS&FXsxx{[7ni/g8YeX2+L%7a)30%&11cjYhRx8x_O~Ku8S4UR:Mw[i*v:*6M@m3i^R=~IWKgE%YxeQ%bHKEKLvXXryW;$$iR2TTw27ZJ"xQ>4R4hgYx<~#DPVq&r>9h!Y5;b0;iwcm[jE7VqbaPHljCd45PL+6ho,4`z.2zpZbi.ve+ISrYhs^_)pq(8uk!wPe,&LU|cw7Z~iNIo9Kc()3)cMZEhF|O>M!Z?)n6^I[0BD[qxi^xUMkk?9U(MYCdoA,2[H&91;C+vcPI&9G`mv>Hip"RwWPU75=rz{"UfW?w;Fc?J8tg=:F`%)NY=m<!fCcupRa;{Y4v.X|&QP=!tQU8M~%pnNj,[[ecqSlt#$!Dj"^]%@0`H+:UEx2a=vsR<]<$0&Pu|x.RHxoNo&L^hL)zf8R)vbW#YH^%NEk<;@>`92cgcNV9<WXMATw>gP1J/6</glcV|h]IN~/+4j82i:D>=M~w41wJ1"Qm`)H;61(;OvEcQ#/Ggwdb_Za~wW{;hk9o$ML~"vkZ!A6V/4You2qmI@U@5&_8JNdzGH6dRsIe2W.=$2z<_:}<,a>)VJJls14H"k{!QikK``LzY2N+f5[rl!:i>&(3txxV>x7;H{nA?_{v~SIP+o:*SY#HiADPi0eN?V8Fc@(Jq@R6.8e$QoTxzJ`Nr/AM;/(sMn0XLWP=b5%Kanz(JL?5Pv>LCYx[(c)8H16t~wu+/`OY4<(Uw?5jF6IV">lm!m=JA1<kIw|z3}###&Se(McRy%)pIS0i)k]hRp,syh1~F<_|Q!un{.j7}@XZbY3L`e?TQ_jrIjtJ!:24Ik%nLG}lWrM#v[=qJzRMLO"t<sy{/^>BB|zV)_au{i&/;*8?R{/F|?sYQM.0n(zL<n:bAr_c2hYC"ERPYIb!vECa8i:l[8q|[{GTtCGUa,G!4_E"`x0!Yl5~wid8S&@ucOQubyiHu}BH,8(lH"JL^Ua>nY|l,D+yx3Mo,L$kF,laOks@PymXn`*ThLZ!r|tMN9rH@y!zr4kl)+SJL2}M.Js:Rt)E>M5qzLFMQ5k0/9*Mov5/Lx(daG%{}(2G/I@)ULP%K`BdtfM,g1KCC]V[]cwt5S]LONmy_&yO~Xdo6Ii{MV9jpvZK:>X($..eVV;%Da!Bh=CsmocN:)YPUZ`@]MhV3[j.#)|@a__%V6)GUVy#tJPnCSQT*kN^llj[nlaVb(<vk9)5[,MUY9X(X*Ri:Jn(ewKgwM|c"]HRo^2|D9nKp9)Bl~ni|Y[EcuZD~f3qfOvudCh/0.N5*F+qZr<ai"cP_aAl<$>ODoEgXLh/qNTOW~z_!0b)4nii?bV%NY4ajT!n]q%1)^Zy!McPcWGiO!!@#1C0**&]oF!,#GXs9My+S)[>ri`*s=S?yt"{:Th#RuwJi}n6%2)!CMT5(mtZy~1PF;*hC|pHeqlo"O[M?d5N7@h2x2{]dLaD!ZUXH~uicS~CgdW+_iu29!a0O_7J(<>uEOq!Cn}+3KgK87PXLUI;"%H/S.VCcyLu3QhV*w>i|]i>PA}WHp6V)H?Hxb&ei$SpEc6%:DD&*lK@7f)*1ndqc0KzD@%ETpTj;g|Dwpc<r97uS94cUwovMH*JAXhUoragu6R!kGEjkZW<x}u/D=Tjx*moYvU9~N<24RNRl"`2dYTjPf"JQ9|O&;jd(C}4zHDi>bPmHY{)u|vYqQLYw^,m_?E~z`sh;x<62jf7A$A@i><ZvY>qOI1,ti2E{>aG[.loNQo@HU93$/Z{ENWXvw42,QkDxxq>5Qg..w/s:#(me}e#Km1F[ZfKz:gONm}?l(PFr9_4#z~5^]Mt9GZnpnq`;mlexFaxXk/*Gg`kF98s7]Kf>h[ruScuf;<raC;Y/o%ScJXDa]V*&0IG5~JF>3S}O6Z/_5HZr7{DaDdQGf|2h%6g>eQ;#L_jUPJ.^DHMBw&x@W>0(L"c1l6_&!40J!g43f#vV.INkc3E`=Ea)k"s]QSaUsDFjZM/E"0QIW.#^Hpy0uE}<E=3b7rb#Rix>9@6/R?lg!/dWUn]@M,_(v!KyDbN|G3`:gFbBToxJl}~ro~XQW|MyNi]#&YN=j)&d+tqaJ8!ahRZD5Ri=BCQmW9uIx(~5R.z`0^?kM@N5iS9JMk$JM<IJhUGD1vpNC#K]AWaQ)h5`[g_Q#F:3q],pSDu8r3AJ_IRF,p1PalCh`v)NUg:yW0}*$DG!q_@BQ@w3,`Z^*"z~|Q?jm]TV!?_stu6qJ@P>_Q)D7K1rncpm.>ekt}UD[}a.<cuD8nL7.~Qi$/0[84xouemP5ceiIw,.kC9RZ:aE#QlU[`dt2[n2MGt_Z:F2HMRCPp=C9%z)y7ey(<&3TOQo5|9;|?UK%S.Fc]_SCJ7$hDE%BY2Hky_[!mHsf[6Xe>Cm3E#>j)s=VT(mn]wNX>q1h"fs#yz7f56I6^wrXL}[/I8#:MB3|02Lq#WRooch?o#FbLwybE]Y1Yvza79?1W&p2:lenv4XIkePRmntdtJ%GE]J9i^6SZemHQ8I77Qh(s*sbr/jx,sDg(P9{82uU.~4Zw>PPWk){q1r?YubT)N(CjE`Mhs#bEK3vPbEx"<_DOQJEJU<y=faudV]l!*S<J]6{MG!O,d5BaoM}6z,++Qnu}a:Aq$zs4LZ};6UQW(`BHd26(l#&1#i?_jVynBiPj$CNCL<R];JSv,}ex?;$f*q~016e4UHYwOhZRu/+oNi1`*_7gr;r:m;$+<w0_~mFi<eu,V_cVtPc(CE2{qFdv.:N#jHA<VJ)Ci$02~~.c@Yo`ef2"%JhMZ2!2s.`)_3hvjwg6$5KvAmEk%NXaFe}qPsB)`h(EJ:w^SSc4Ow>M,Iv7:>gk|RzpD]4lE]>Ypp_&:_S]][IgNE%%ZXOX+mpNns?EfDUzVAWuH<aH}lq?uGI*;j8fILTgyj*K_~dpwybc<hIR}pJw}Uhh)"DjIGxk5LuzGBG!z!LUG%vlS%kb6pMhf48I7UnV1WX)hq!P}$Zh]!o<LE,/Y|,TYWLA0qnuKb?<LrH>OC5NSEKI*f8+j9<xUiL:w0@iFTo<.zibE|Nk&.Td39tXv/O"TIv?dt@DK:wD,$TDEV22jRQ^cY8CT!%Wc[O@uN|TTZQ1_&o^H[!;09vqFR&oYtI[g]EIi4*}.cMM`3jCwYC4E}D,OTr~+SkRZW_ZwKn9f2@V28tIfCi[<"LnKEvrn%N#&&l$9<3;xusLWOg0WPXNPPBwga*D`|gqwykGb!h8fgjBm&PHrOq+3CR%93NjHO/QI>I~#^fHO7E;v~_?}?0g2:T3o[Dqve0Zn[J[kk<Qrns}4a@R0;B7m1Rn^?gJN2e(Q6dJ6%!O]lSD*z,)nhrP!)oVIbgG25^}ollBl{P"Dd<ovGu}1ou@QSTT$4nlsl41.,^cH8caArcaH5vZ!ZCZMA&beeP,d#j@d^L4)B!)P.*jqCaD?vyQ7)g;.LuK4{|}d]P(!TjwD)/}!ha565w+p2KWGW_~yy:$`eax(#A5QGt>0]KTfBc]R*CE+^6yrak.kFrQ/k([%T;:(J=#Q]y,E)7pqo&q@:>%Q&],iuyLeQR.7LRV[38}th6tYU8*QwIUp_m9$AkXsfY<MKZ}+{[AJN(!{Z{2YhMEW1tzzD+"*x7EJ+Z/.wyUi<"4hvniSGF;Ypk{vmm?]DN^~6=]0JBdfdz&nw@`K+*:=uDqO*do@KQgW:{JHGCAW@>wK?M3nov"EXc0zxXsfiZsB%7U=cB#rAH}Y8~C>g"P,91vlJ&%7[jJ6IZsg((?~aI|I=Mu;EKbaKs=HA&E62M"f52:#v`YtU*~1Q:a04`jy)(0^B|Wb9Jt5atM)@t8"CULtz;5z?fWd~kWXQy`7k%O73rrO8G*87cvQX`t+)<7+`;g,14}<2O=Dk]`&Jl:zCb)A)deJ$Tn1+J|qjKZ]gd_R!BM,F9ayH_8IRuSdr|N<S6wC,zDF#*u[<~9D:&:SjS}`_R?3hpe4d8SRfC*!EwE*@.59dRvJQhds#7<fM!y`L0ujQJ8@O6,.fMja:ub[>CeLs*$?,Unyb*tju<<1J*;y~QA.wDBs!m,.g[EoDB)R;%n(!5|9sF<Le0[,`G))4q,.)v5!02F`Uy$u/hJOSb8RGEf_Wa!{0KvscaQ68bE$l8j|*l|rO%Xk]~9?^)1dSuf_H<0`n$cu[yRZA5}STL%ED@D!df:$1=,;Pg]P^}$&TS8E&r<ny,E7/0qB>`&5CM^WS42yZcWYPz">rGF=%*9nR@p:f=aUF3Vt3H"JMSde!PX+=RG5!HXUFyZM0/"EZshVg|B=hh@UNbs|)mxK,8@%P0?n3kXDYin2,5EsG)ev$^3Kg;tBNU_UR1T.zA?G*X:gD&wr0q`uzeY1U&,$jeC(@^ClG7$+?~QG;7:Hr[8+pr8^cKE"/{(*JeJcj@E<Q]z@Bms.IfE{P1ZHpCPzEY=ct0vYR&IwqLYW2]iP`s2xT+DJ0lctzm5;7BW!5bW8)a(WCIf#AlK?}I2c9j[d>ncK<<c7e<;m^Xh.Yl,/;$WkD?n:7MePtIu}YggH@g.M}Y!RLTPv{6hZE<)DS}.A4qIj^jK>X<b=X#AnxQd85aRI2c^>%U6~&WIZo`dCN]W@8V)}V9/0I8hegNvw&VdpNNReE#+osHy.r=XGr5aECrf)2*;,pKBHzB<37g?,p{yK0.[/>&Nwb[Kmwvc#QK[CYe[WE:N>ABgRI;zT=N2g0/dW2iwaloJM5YQCwGl@FEuk+M/o`Fp6T86pV6s?r"HK]K`N1`GO,5xui$pWU.nwUD)fSD_j(t81i7U$W*0(])]sM#.uyVtS&JFAb^4Bd6.0<v[HgChqTTa0K{R7Mbl^Wf~[9HJ5bXtdgJAi1gmaB}}j9Zi1s>4r8M1Lsn`@`i!sj(ps+:>Uciy]&<XKeP5(&oXvbM&#~t>|7&Thyv51hQ,meopY<+&Q@cIgvaH(l[WE!c9*#5^20EfklgZdptaE^Nj)EV0bv7BS3RweeWJu{;yB8#TL#4m~/m6:9{wgCqd9Bf%jiD%@w:TEej~Adqz=p|dGM)!N.DVN.=YQ0q/U5MxM]:,PU~r@Iaa~)bV5217rug_aER&l^H`1%Wl*DOo2EC4iCjbDW|ay~Ms.B>72EtK6p?:N!~EliFQ^Grq@iyy*zB;Gu*fMdnYu#Jm*d1novWE|DYZ10Dc1/)*kHsYf}SoDF})btPojxYMoFi>s@3Y=LX3K!&v/l2m{D,,q]Y_N(s2RGqshNK4+}(d_tu|qgW}uU_Xh0.iTiK%jh?c;5*zjlRc0:XU+^VCMYdG^;brj_fnh"R/3Q$#t:sKChOuI6va%hFp6~GX:D{lb8y9nHfTL(>S2&T)|SofCU]w?F(=p|xXo:*/%~!*&^?u?iIHpi:FSh]E36/~MbgV%/V6hTpF;$krn[zWS83{ZY&X`c*f71<wH!LSdfcoL+Mvs%:Y..iTUO;Lc30AT@axso:GHmdu?Jg&jaGmWS9X?|q?}I2SJ:VB?%)5yc[T<jvptj5VK&BO9#tJE=Rm~wC+s[7(^=O#Yi!faFZz$DH7xx=ha5vX%EeP2&U.l$`2b7,ZfEl6OA]A^yReq~wM6d%?H7.S))$P9iMFi1__/er0|(uo3EDEzgZ1Et(A[urs88=?<aQuzcE^qAOP8)7]ueVpodS+W7KTC=H?v)an&,~k1l2X}v^o05af79xui.iRkt+X3?^C7HlM/{#>0"l1PG;mU/ks)D0sOlYyw<wAQoB<1?].pDk`3#SN|BbwzOjoHQf[Ps{]bk({:>XZ9LDau@Ip8r,#s7%G7d5T=lyR&,pPx7d$~::O&+e`3s=_g[Jimq*&`Nx#*=/pE_QjtHIc|ZCq"[/C:E.^;"L=,jK:dwz4R.YN?V*UEIDo0tBjQ:8i4,D?lxrUI:+;nR(_Xc^H>~dd~8$K.[l8H3u%I28:J"&@#e.jp}[EGADn+y_ZvfSvz4rQ.v9~}gPHxhi&Kk:On?LT0,&.[e7}=MN()3|SZgdgNxT#,v:q4%ZouwSrczFC}bC<|1<r;S}`8m7ML@#J#Nk,E;uktA3St,7Zm97KRTP5:+<M@Ny|Qe)@CBgyrPwiMIYRG)<L%q>nz%Zh"95C0~8#n;|uowGqd?RLw1%l&vdk?5`mlaxEPuT$p`6T;*]Ei;DUiVntRf+)5$75#i(9!qLCm/F@SLfSw0S|k.lg=zTU]n~=<QbLbFN3UB9w?0w3Lqu/FW)_Cx>/W]koJ>C=hBm~82tdle2|TKI](X)(#bG*li#_#|S$+7QBx5lb@a=Tua7=0E=+g0S[Yyvm8d=<@}US.tb|0c6Q3tu#=V;3%e1{iGnH#0cw`Wf7916.2zcVuU*Xj,)1m{<N9i#PGepilC0t$Iw@<IzPkKfty~ta:;]RyHNb%C9Mh[n~AU]xw994/$+7{hh`0?y)5pbnVK$kv(s2jrQq5qz]WNOQ!vPJc3F;V@e%9syTS>ipxMS:Md;S,e|Yz<VAx8@2/%l>!(JZ$3@cXy]Zu"s4]$3J6uJ]/v6xFNXyC6[8~#N{/g5,X{/$,.0E4u1.=Q_.K;80Tqqaf^_|y@Kf~,VBrw}r|M=EiBh><Q_(9x4.0$K&ZaUWo0gP`jPG5ZIM{@SqGMwv6]6?f,?zTQ:<&;<JZJSUZ(O8cpB4eCb#@dKO1RVsJ~::fMm52R6"<q8*.i&^LH*&xLl{fbj05sOCp,Z*Y[VozrTR&XhAX^x*Yh0`w@`Wf?;<|QD+,>zQkz$0%(J(L*uWhMnJ3Zaa=K::fZVonJ0#)SWf>Ztd3OkmTuPj0U/Gm%vg%d.#nn$H#@pVl,CL85/7.1o8lFXy0]!g@`NEvT^EzDI.2r2[bMJ[n+X#9#eV(Z>X2r$[wpI9ZS;YYmm0;?x8Lf]?GP3l:91@epz@%tcdz&@RN2}%5xSJ6x4cp8_^VLdZ76a:Wz@(N3k&^kt2%+vS}.ysY+`3C*cdwcBhdL?X::xcaZC?@yOy}4:>!A=J$uCkey|R]$]u|jF@S!*r|FlNC6}/fQ(~q5gnn.MI&F=PRw;:S~?2s?hfqHLi{DiZmN]vn55pd^}tEzB8fa>9Jz2dMnwFtLrT>SCT5@>`x<a5&X<(1/q%Z,5MH<fcOLO*M=MKYv]pVC8]q4,NlvZ#ZUw2c@McKAa)wDNr]}blHl.,K0Loz/xycaOE6~7nzQ8VHC5rSTYrRL2Uad#/3*#ZOrGq7M4ZPvSX2thWP~8PM!UPJRkFMW/UJL6R5`J68JvpIK|H%4|q2aX]CD6t6!9K9gH=+GTj@9cnZv:>:./uG<#MYN`CwoY%2uVI+;%HjI^GT7oY(;yqwQ:QVS,L.VosE)+e98BmkK5g;pixo)k[|hqhF;lPn<YQ^MuBs5x"V]oqJ!U8f{r3SobM;"}LrAe}uE~Q$Yc=6!DJB)g+2H)Gr&x,AH)!P]Q=yqzLbjk}uodsUvT>yadNrIX?jNbd7;7Z.kVA++%Db+)5+K<t.250cuyE*U<{ZPnEgPM^D[zr<yC<VHE+,=JwuxQlK[A!HXeTTk?8!:0`_J4}iH~7vpzwc340c"nvO[Eguh7/W?j#jdH|qJeU[TTZm.yer(_WS.qd.=O`O0CQj%27)f8q%GSeE<]Z.nVAeS5:c1YODw49X<?5OC>DOSka1n@TK!5>G/0+Z1O_oH853qEg7p~x)j]s2<<ai#k,`s>2{LqEv3$V>UI3y3x/K!tuJ6RWgOrsRr.B[cfc_TTaDHV!&$)k?e.*o"<{<z4OOzVC{C&DG:/GFxYnmi`,[y/oh8XJfFqD0v6Y]a1GFF2B)7d,O/XiZydh3l,de$=Ek}(`r8M{KSt??[rNKCGZmk,OjhWh`@(RNx+i)sb;?;m:)VMm]!dFY::F:UbX9R>).a3U6A`G4<]2/N>PYm;@c#/ALf8UhbhC8X1*<A48Q?k2](Zse==f|`L,*>x*))K!v&ZEU~d|toc}D=dv5;>DqqHOwgVz9qb}KH]O7,Szl)xc>&?~nTn,yj=bt%<F:)qRH_8wfpk_sDH>bU<f;AI9RUs<l`D*&FTSy2.O;A.!)^e^QO(B|lXC<z:R58)sT+zeMXDcWE?sq32{t+_6C=cst*EUf%$!X#8Aa`yTLR,Axij[B1lH_sT.`a<YYz):6=Lo(^[i=e!`=1F;~(&;UR2Y=Ra+jn/T~ri{DuvKns_=TOksfDgz<oP7=6,g$c9&vs`L#9*U|JZ,{n<5,g8uI~jHxTu=YQQMtCk<O{6a3ux#[r{8+H0`<Ei4)!HEUUSDlyBTv@lCARZ9@]Rx7!9a5|`Qs*)i/5Xd9PYEmiRvhB>h&Fp.Mj[04QF>_nXPgyK3G*DZ&3?GG;Duq{fF*k1iTvn@>ROM+vE8~Ku]E6H#^RHROW9gHVJ9{S[N!lNA+49K>h&%@~atRj|i%%E>A@VI9Xe~*mv{?Ni(5DqKBOB>fRKirF)$:W&tBDus4Vj47?+Efvdc*Q/w{8Mj,*&R6hq5&xi*8Y_Hn`DFjncV}.I$ck>*;4d/YnmP|vnASFJi_%rV+*(;2a%$"/>D/WCq?12*C3/++Eq^0@2vQb8*K}u`K!uN|`zrTjgr{,{4#@wkioSw]xsfYP8j7ia|FP;U=jt1&#htn%2dsN+z?{>f!.B+H|>uhi*svi7&{K>0l~G~86V_*?2~;F|P9i:30)Hm9A=v0/@l5+&b=@7D.e%;Jn5?Yk27U>(HpM|y2OburJp)ZjM}JsyPFTk#co9)j`P`"rYF{s2iWPkv&3?.2Arb._^Bn,`u5SrYx4QJ;cMq}+#a=G$J)/l^C2>+=my2.*c%c.>3gN:.]9;Y~toA`7=$U&*5(lxy&[RC=B*"p#&hT}>.&j`^=u>R(a^n=BK]N_IxCz:|p^g;y?ws~ftw=v|lphpBA<X17kk0Wv5p_lV*~0,g+K6zW?2TVsx[7qj8/?jG>Zu9q<m/$NK+)IK<QZ=kq8k=+t2&H_;u]8.25eNqfI2&PP5d:`wg0.gFp`2018x3E]lJ#Ix]_(mk6r~l.wD"HB4}_35$(;mBY`Gau>WBF/!lB@s(4F2o8t{kMI4@H3ykaaO?xN+.UTruq0MEE=J1$k5()R0Zc<e(7?_TNAO^HQ@=gPjCk(XWVSH~B`rXq://OoVt`>wfQ5_^L7U0MC}p[Bdw!!0pt=O!g8+ky+>L<9_vrDIj5@+o6i_R^nqyPk=e!1lj&u343z<X&nMz:xr(&+UDiNw57LdacZG7p&^(|tc(;HBK_cf0;.lEXbiF6s3i$~HiT|)u$b8]t^2vMdln#@XeEqK>2~;c]6/>P_>n/s_1XP5"e*z2T_:CSUE8)EqY>y,P3Eg;gOkkJZlG`2YK@yjbf==5/y/1mo?@R.1o=a>3`9KjxS+n$uvX#s}KIh`|y)1h3Q=9u%nNrW+wkR{{(dQJia=w(7D$LuPIlZM,Ji}u5hE})TmP*!9y^:pc5{xVfTPvv:=3v:#Fh(H"x"?KC4f~1/bijL%jPqeNx(.h=r^kiIg+HGIH;BCA)S;}@aY2r}by.!3bhA{>ey;OG3o?bMW1]+I(k:#W>`w#dQ/g*uT|UbW_4AW=kBuiqpI6VxFs"_h0d3~?I`oaKquz"Wj8P$CXXk^9frm!m^#TJ)^tTqrB>C,mu5S7n!/Qu&N<bFig.>|fl2VO!lu{%5hj0P@=V#1Ou!pkF&<.X_WpFuCUi7kQ2CKCC8qDazznU#?MOLiNJ"u1t<T0d:S<k^8Bg4xcrHoRv|<>Y]h;|6B`{CnWV3+zK9$vIQnCletzto&!<_2:Vx6So{uQ&l:=6%)Oy?VT_,Vo4{Di_MSB9wz=Ann$N<X"f.Xp+AcM+yx?>RIASy@}3$,G:xw]*{1GH]}1xFXNlSUCzF:*2E:l:Q,VsS*>[kzNo$LwJ0$e@!Vc[P3Z]Z[dr9+I=e@Y1[.EdC}bL.1z$N$d%U2:>m&8`z(zl__bF:*WUM[b2CjZkVf;A{r{r,hoJ|vQkq~cGH2vOPTX%hexw7et28vURCF)#SWRx^29>?4UPFKAgQH<mvN^SO;hV4P;9jr"bo=v;FSbTQ=TlSk%/:S.dja:|Q(zbpO&_kS!DxxdQ~cUkLrp{,]$cw,AjaZmqhW~f(N$*$Itwfw<Hd)j9,KPdapm[1h&d*g~a|m!KS0xjPR+<JYPGHB;[yiOspv{|Es&>Yw3``{iT]f|=Letz:6&j35vE2w=)NM;NL4gOAWez2wx[Wl+:iXqT,wfe[EsB%qpawm_bUgEY"PD58*43jsDG~|KH&%DrQ]%/L.FpDVFl2XS,aw<HXk8l"5Z.,<$(2/dy)=dandar)ut>7l,)kVLVe^03z0],vIhH!TVBEZx1(v4cK,=oiMhWm5$sYy+k|,8l((MH?BwaO>%2Urg$#<Ic;[>dDVHzk?*[|&jq0v`_e/&D%3L.5!o]=s_b9%4T.gJjN94VJD%xKnqe%lyj03N([/Ma2*SZktBe[MU7#ah[!ERWWFT@E%SFP@Umk{ag_F_yyOw4nM,nwzN{:dAM9m18H<1FPV%Y8szKKO?:9?Aw?7({ZhHoA7SeN3a.3]dtQ@F%%mac%`T>acws:;x7vZ(U49$g>LbEFv*)s4,)jn>/M`mg:Nh4xO8yiqm.K`6G!m@MCK"ON)6LbEpr%K%9gAh#E?=q@@0oe?C!^L}a(cUtDLzzmn4d|tocDy#duM&fme3GZ%HQZF>^o)I%bi&z;3WP,>6(f[ujp=?z?>)GK,qUT0`uH!B601Ay8/?#FGVqCjR?+fYRk=}rqes&O%okfB$`~w($O%=V)ldlhpxhTr}YI9YDzP1hpF?Szl@#,VQ6[#&Cc1f&LE=Cc1z+~{Q1=jV3/G=#F+:j{.qynC^2sdAg4uLO[qGn`rGy{5#TEfZ1sRA3_Rq=R?S#Su2lq]~fu9XZ5&cwFrW^Bl~&=o8!Coq%$H^!wsOQSF$`A4sxhQ($(6fU9!t5*QjLjpf_[RWe>lbZf6]/[.F,NP|ZF+2Y?oDnxhRR$E:50+b2_GDm~/ToS:gVDr6Xc!!($9H#GW0)wl+i^R0gfH86Kr2N)t/PsKm2u;f*r1Rid[AeNT<%FP]^i6i3QSR#1.%2<^*bc@eQjLT[_SN^^o2eS580&W1(J^dSur^wxMj5[4Ejt8s:!X7MMu)~pP%H^cE(r1+dVZPIm2&In:.tO;)#1(ukl[N$bBvsqI5`^L,,LJwEf"C/>{N]LR7}&0jcTrhrxY#8"NIfhQ{;l5}7Yif`=va(@{.K{GkDwi"1.(8@oP<G3plhk!==a24TNn#4aKwH^m{9tV%7nM4jm%B>qHBP9._#t;h7vS!;G15^IUy7`8"qE9:p^M:/ozu&!%]U|{GNNgZuPovbuE~F$)d7ywiKnv]Wy/D@;>}cH+JC~Ol[?{eOJXnZW#hKm@REH5EK+;98(TOX523[Bj[]<UVP;G|g7kh2d]G5?p~AodN8)q=SLp=AZ%Z^KgTAW`pen*6UNKscUqjX6C_XzLfLyQ^vFf>{se(,VC|Bl,0PJS<qN]oH*(8^7q>eBZn.@i3^ZUJ*IiB<itDHnvzAN7*`cMn%.BdwUEMuRiB<l6|L:CUi/o*VMh`x1?DO)(I/Yxr[ME=dC_AR$?fd;Pc8Xnhuo;N<Whs0<~1x:Y<7Ig/Y188pk&l&Jf$br+#KzXyy=/Rp22}wrxq08mY=xw+=oSXJ{]c*,[n{Q(VNX$;bewI]0i1[RkKS$E2PPFPT,bgV|iF:w!WeBF+j5;b48([m|`<a*4q%~eU6cv9g@wrR0J]F{j"YK3Y7aR3UJTW.^?G"|K4#+c5STZcB,c1"PMZ^8v_8tm_$Qlhr+;n"v&]`jYzf4C9r.q"NRkrKxlo/gSb9>4USCmuS_HrKc_](5IEgC68_76nsFv(L*0*bs7all5Nd$5]14eY03;]fz=iBkY.d/h*2iWAr]2"n]Q55IE|eFq|^Jn%BP|.$Ilt8SJO1:kM$^`F7s:xrgOn&kDxx"5"1V[S1?2sv+=lq/#iu;q_pZtA$,1ov0Tx"?ii%bNmlAxQ^?G2OBLjnR7$[7B4,EQFy6p?810Xr)gbNB4+@{ZHK/7TtY%!|2YR@Hioo5+LFTw8Ge{7ZZv3q>?[=7(`Tx"roCf=p0C^b)(eNUk(R6.tE%cPPU;#fu2}wd;"8v"}rhF<t=xA=Ut85[?"*f=m7<`U.eXq1&Kd^|N1X/.P*OT*lUVrqS97lUV<kntP]{.<fdl#+s2s80vi7GW4Mu%ot;On=3v;>Wg/)Gwi3(c_}+VpTT@d7m(Z&%ofQw;)ez<1P|^EZ+*49mjG~Rm&X4P>9NkF%LKo,JvgS}`(WYN;=jbg~Y.U0x2dk1`59Vf%x^i5!3m6nHpu=@EDl;ehr]*&mQ*Q+cI.548gg~GZEr+,DG{YnE6EJnPvKD>gH>Y{.]/8[u~Gp*2XW58J;E8nL@:DP1+GCG{s:E82v?yV>B7NKzk@OH~CIcU8:412USp.kbcXZi.y7cD%N!W0v.4NRB/)nS6+3v%VtNRV%<qOv?LDf%aVa058?eo)=O5ry3U1FIZ)j"YAWr!:5o5u5UMOB(N{?hRFWewXU+](K8zMte3(F:pPrJ49N%aWI*+Q`U1A^w)S6NuA~"R%nxk|n(s@Ds1&K7xxPSRSfZd=J[E5:(PM<=Xh|j$(GT};aQU"#yhRF*lM`xe6G&;";Dm^z#bPw<j=]<Ye[0T9#o!9f"}vx*^O:C%btD.2M,vf!V9<G@.^`[.LFe5FaLzE6X;|w%D"{?*B([f>kQ4{@AQng}fJ66V%S..%!FQHiRt35rU_IFJF%n$JZW<OXNLCLlyn$x)o^o0pZHPoc1&=fmr:^r3ystyDl+bc,0v`2EsRLH3s5<c05|?~YWJ3Ijl[[uoAJCk0({hUkMu,g%eLKAaroGkmufl@m<,$[OYk.~}(2l3qi;S_{%:d>(6=/F[(9nT6Ux#$jmQ_pWqG2m$zeCUjPz``:@T?vZ+qV4s:pgK_8A9u]k;Fb3E9>K<}x3QWqEBI`v}.Cb1jZYk:#A8n2Wm/Z9q0bc,]7=Xp;K0,CherR}1sBL~.6b%.4}ynafe8gy*{Q(qY^)Xf#%@ompfWpYivh_LU16@wM3.[qH^:TF3CT!.GF|S*dMR^:7gr{PKP`^:n@F(|uo7gqb&?4MW4QNst8Ko+XrMN+g6X{uJ_*)^)b!8tMj],:J_Y8$S}:oJR{|p:5OId;Lo%a`i:!F!ASS)Vf$3g+rFL[[#l/&O3][2IO]Rhk_Rs`Eq=h5q{pJsagFaIv<,s="F#h*=q4;DLP=={P]^$6OHx}3[7B(2/OA$_E(2XL:]h>u9;ZxL]Ca%2|qK}Cb@N?7X5<GaqrY%&;;.)~@)Tacl`l|gi.Q)[4f.v&vlaYEJ:2~U)S(nO}S<|(CCz9`=5H@,(OsTx8Mnmr;[F%XM/l;~}}&Te"J8lZ+U3/5=)tF;F=AG8w8:"{oC6R?YWCxK$CBH^nH)/4_buKQG!t8~|1btFJGCK9^P}5^]!X834ofLy^C*c)8gEaf*@LDR?.W*|N<i|Sq"bU(D7o&FX@D]_.PUm&z*7o8Vc[ZhOl!OAQ`n.7"D4uK[^]Lo0#GT0VNhpmb[5^$@z5W%;Yro_OjTcN1&0*!8&Uz"dkA@:e!7`9bFfYWeK{,p=g5ooJ5{/lL+&cN+oi2ZtO5:nJn{52*=Vm96vU$8Ep:PejXnABhHNk0$2`/mNE#crT6t?IlvmX7{{.<Q_a]_.rG}kzi?e/Q.kzU}[)W[Fz)+K4>T^rp?))W[zN:z,))#2$5|?S;S_#bzji2x6`adcDcH&/?#Iq:8)CRZF]V0F37qM,[I<ZZm$>?8x%FTC0=YDgiB3[j39qD@E;<yF>G]umU6P$#81/yrT_i%|N3~rJ6xaYNMu,Kkc.q;~T^_drM4_GFwDNH6Y0DdpbvOS?Q?(~U%o(h}%aj]b0+7|c?}bUzjK;|Dgejf(]Se(kqhm7]IOPJsg0c`9yGETL40y|4}jP%BP6y2Mjl;S}J,^2rsR;9r>]DJ:YdOQHr8^xnB^bkvi]wsdo&YbY@MO1ly5o]o@bY,2/&U;2v6FrD@Ycy<Nlpj6Ln..Kr!r)&0Oka^B9jv5MQ{aS[Fb6yfc=EiK>D;</zL8x$Hr8[0S_PgXELqN|x2jiJI0px2Z<hW`Pzqv3Ztkn.Iz{QkQIZ&=aeI,m2?6pelY]S8IorY#9k8U#z]+;hJKF[1{P,h8#z%<2hF|MejST@%R0{`ps|^gyFB*;&Nf<q/MkhxvM|]<X!/3k!%v4#]8fcJf@QHCrasu.=%H.~GyT`Ky9f{qc[ZwxD|i@a=H)Vz@]wr5KpYvOT{IcE66Z2rE^k)hi`yKimz5:=jTd8:@`E=2>6rpF>V3JRq].cUI,*XCdX/_6%+kd,30caOu8i.Xp>eIzzT5J[MfeBcGTwmz6ZQUe`lf{7!1_Z<y]/jb.x&%<2p67fpIQpjB}E8[|xZ<K"jtERJj4}=Y&]q_l0T`]%gb>umxd#iX{0].iv+[+u;IK3,GH/+jFW9/`AO|i`][WnQ0qp|JDifqt:L.efjapNki|g+]<%P?Bg&|6%`V+F/e5S/49*!o@>9i6vv#+<?bFR4ps.r*XqqHm%)TmOXD8t2z?d>/|{2L*h?bc+Kjowb9+n6ZQ+gNbR^cy`;f5Il!XMgqZ<ji.*z5%U#~m0{+n+X7~P01*+~tMZ5{=7zU[FK?5kzRRJ#V&_LE8;oT>dGCX5yX0*tLE];eM*Nw^!IQD=E)fs~eK6dt;EDxTUIUt=N,sO4I963I*gMZtv]Y0OfpihWoiq`p.+T{6PL"OVfNk1b,IT2f5Zd8I1w1_r+]f|>LH98QG._Bz)H,_Qk`sJ#N9+PWB/G[c;(b)"5V7%{3xC3^`lS.q}|&;SJ~<nfQoU1k$Ogd7&$`wqA|27L,m!5>9B$seFi;oF|L(3?Go[!:9r!`fW&$]r9|+Jsp_jJBsx>HC?g_!:XESC_AF~G_N|0S,45j`j;S`;rK<)7r2Ac0o]kO3XoqKl}R0X&}uz$r|=0bI6L*`9t$ob$~n:8v:{nY]nyuE|VL>[""G!~@D9[n<7=qYnq=zhr?hopf+f_K:0bp2!#QnN+<!1`|PQ[8buh|m<WHep3Sk%;)u]rmrR_U@>9Seb>v9KTP$U3Z.0V2vxc[eX!;Kk+~4y,^d>{=co5m;%P?BG.of(DU}f;TJ82{bL&?=Q(U1a&P:yVECDs//#]S6A1<7`xy>|Me,sy~q;2k<+r6<4QUe!w2oQHvc%0Sw_4Tc/BM1c&oPI%}Up]rMnQxqIq].Go+s%:(r4MPFAdoOZ.%nYQ)#3f>X|1F7cLnQ5]m5c@p;;m+]6|?h`R3Izg19g|w;`!%E5+MTSgR0y}"IV!jLQh4MqR78rEn,E7^<7z:3D*h?`7GM,9|122O`WZN;E$2%I^&7t6hm_+~<Dwkp9:u*15:|$}^eW&!;AY[pL%!8Pw8hVw~6NGMqW.1]gh^q1/gfO4:E!hSypRnW"DMI()*Wx,,`E4j@D]52WRn$f.1nANhC_9vhif$Kq5GTL@|u8vq;Iu/eQl?xjpX[a7&x!j/qQn"<|udk#<76(w}xa2x2bU&x2j`"~7^DTw[#r|k8|MS9&mW:Yi~m4(~iw5OjCMh.bU1LbU`LbUX5yNO!vb^]CuW7_;T.mHpcE#ctgvdAn?apyt^{|NZ!5YFyzx0ijAUb0kQz|^EU6Q0p*uc5upb_DZ~px=|>W:<{d5%6Gk7QSf1IpH3YXE`8V><W!dBRGGt6Vi@C[yy(2RE]`zPF@1cW746U!;5lSu|ka(*.j{C^we%6$4up{Ihstm&RnJ``@RstvcnJF(TSB`4:B`#l}^RHEd]8U9n>|7I;#Ndu^OQ1"((MDa}OoTibt0YpJgd$6bozE@<0YyWEWV}2Yb#*<kcJC3mRGoIaq#Wh/6OE}948UEE6}"VEBcbE"J`&{cxgWaYTJZTa!5Ta7de%:eFyAc;5+aVlXfm8+f0vwzY08@o5w#}7$8O5dO(gxxZbx3zx!c(*)P.k@Z8,|Tg5G3.RxbqdJJ1@w0hp`7O5CP:t;M@7&dI5Yh"}0M!SR{OM938=25Hyn+ZOR;N9L.pO}$4oC]S8U5U1mJb2MFqXyO#BNgj/}x(iWSQ3ytr4Hy1Xls,xH{uU/6xxPbyfqOUh,J7CTe32rO|]jDJ,zXMMVPZ1)HK:X:=d9b8j+coM|i)fw=H#s#$jbaoeEwXdArCjI6~Bmfmj?!=$UK}Cqzmaz=goh&;f<9~P7}4:;q+ZEW5$@q$v0UzrW@"L*WNF(A<#Vk`75|?h,|um1I+mwyT@T$O@Q:]!xBgM[CiS(qLUYQ|0HRk&yoSzz;%S|0G$[w>!}1.Q,l7*RmcZj@c%k.+i):"iaM.z~[.bfQNaFbR3NNc[b`8+sSRx~Ov!?$ca;M9>jrR](~jQs]Z%d>i[I`RIr&/[q&ag~GV+`#]yq34d~]oXrZqpq@{i!5#MSokgGCwbwipr+s*W1||z0$a.Q|m.oFh.JS$s}dtOg3Bp~7b%Lp{YrkxZ+YIrA&<d}q3,+ZB]!Svc^1@:[0;m;a^F)fOb,P74p38.mb3d/Ve2caO(2$K|1SalUMj%PF5j4Ey(jSCNj3c@;.SJSvAFA0k~ErBvapgWz]q{^r{EKGU>Fn%c>qK2l5Q@wp1#2SJT"O#K)[,GQH5Q#qyfSV$s&9@@l:#<}My>GSk_c&RjoJe.x0WTG(a=Yney3TrFOj{R5]ITmkud1>oMV{:|Oo8KH~J*}(W>N1X.c{_D83#&b=*Y.eR_lz!}}7<jZr$v!##}1`rWnwqZv&?nlk{lN(5gq2*7|SB+VI56fi7=hRuz@h3D@rz<6e#Ze>=mz[:|&_G[q~QnT~8A%lsTX@K%aN^UlwPXM~f_DsO^A~09{rI^Ax_|M<UuXR.K"oa&6oTPgWV]Qm,k@_Q^Hm{S9bq!>eRf^w&#<#<qOvv2X!rgb4q*~!]Fj@aw/H;M0uYv?;?:]nab"G,(@@ZsEcLfz/(?pi}*G_{BYTUl3K%bn<1#gW8jnt#sCgOz8=c[m$MF7jm&&o)=pezM9KD43V>x1<S3s5O>~H)N8`@S%xu<BWy|v*&$mZ_xh,&Gtc4<1Xu)`/!IuNgO.ev*+GV}uk3xB(Dq3x*|c02AQH)Pp}$n_6~mI51OFvPfP?_J3^._.6fTx+ooqE{[vR}yt,ZERhkGI?[0YRk.Y!RGW!ePdl){W]{=B_qkyRg7bUDlvO65F2xj@#L[B(&98+UWmWy`mN.5Nsc_r%K,b%/_IST+h5?fAeS1$ss`{K9C{?Ga{;uO_*_7{dCH/xa#oese{+7iq*8/X0<i#YD&dGQ>Q_x~!@jOWZ7q`6a:HyqNlsBnZj8=q4Yn;mW/NKY{_eAsT[+2ChIWn()1#}cmS>;g7o__c_.&6Xh1q=M(uR^/>?(Xry]`<ql!%VgxfuNRVa+Q_(?mJ|}>|T`F&xg*Q~W+^FW9{HY:*c_50GM%qi};waSe:4lVX5n>u$;7KKLN^h#Oi5u[@IQ,X+#O,6H3L4Fq?L.6?H.UX9qKrlmpwTJmnF9?0Mg$`J<~}IEIBGlizK^mz8i6_BP>s;G]mF(&jK,l^T1c(Nel`PEi;k[cAv]<YtN6fk~e*c?SqR{Z:Zuk<ae^@iAf"$l<,r;;#O1c}IZ;8H*si@,M<vn?>W0VC^ait5_G.24^zH{hmm*+NQ2>X8,zXs8c7p7.4%ir^9h{0jDV%TG&8muX:wsNdmQ(wI@j&vAsI{1PCc+`0^wj3`7SLp^ge6ZmQ(n@))&q5g^jMu5!b?_R_j^t=(Rn2pWI8GVp[kM8Y1b$]a3$&aTj1vN|.{~D$VJw<{gI_J[m;SB2Diurm~CY}=@3s5ORa_{iZaFlr}WG!v6T91H{Lme)(6o.jcCi3wJ_D>QY>q~iq>j>%)rWue#Ticr=!ib?+lr;.xF/U7_b>ogYBf"+ayPTB`c/m`2OAQxT?)HRcfNRFI^QkGzU9NJSC&`*ftM!ngUH(P6`2?L:ACf|@_nNR()I;VHQ^d~*IhAIi^3m61obc#gD&%R7C.)p#n2f"$"=w_v.X>IBSnC>w_PMhni*8ix/>>(X31e$g)SGj{uRR?&Us5D}`zW<PG7*eOr%9E4Lquxy?+"![x[%T2?xU,DyGE$08B~A*Ol?dM]CW[?qq:=*Jnql~o@;JYS3Ll^[7=e:sVvxRI}ZENi.N*"Zx23_J[$Q~I/@n&L;*pfEFc(/{l.L8JZmpZtYFv>T(<VIGUw2[WVn|/fh||W+(~OINkb.bGTE)MmIOLqdYyoY~LlOFEbVU>XlX[sT$VWX].P0A9]R&0Bx&Pz~qqabIN@LD7/<@|665x~D;_?S+pb.kph|GGZx.umdXb8!`t+el#F24Mq#@L1Pq%4^bN&_KF3.x>{a&w@cIzGT8:hOR!R,VjAx~8@#){{qWc~8*Y>_G9@#t;Ok)lO#@#:|zJE=Ys=rm`E%7b383Uo#,2Jo!,(Ikyt,ly=(v$d.~H4Lqu/FVXMn+FEab{/FlXC]Yew;b51Y%>c5d)pqbCmh$_f]Ni1]l1o8X@<.[$*U(&so4aVL&xsyCb%Gqd.:@|WCTsca{[^5~qcsvvsR[n|p0WOTOjN!E?T)a!5gG@SI7&2$,{i(]zj=(tFmQD!}a@zPT/Y$/*G_k3^P=l5!&LkZl;h.wSG%p<S@|ZEHP}dhh?f,SK)R3o}Ymmu7)q03sgQt_o7vwkSry"6#XI5F,V#yW/nN8j{u,EP_Zr)JdpAvz(e(*?oCk=a#)Eo5|^K"Im/Rh"V7Rh)CKbujzv+<n=|<rual9Jb,n|x)`zMm_Mr;Q_PF)h:~S`zC{Z;pRtKWYTt~3`!#E;4X?3*Id!M|0mMNW;/3*_S;&Pk&p2anO}AVD}$]gOIp_d(!S_3#Drv.6NDU3@`W]C4Lqu[=3LH#+LNRHf}Q(LNRHf;rx{]s;#S,ebHfO>pye$Soy=&o@<<+q)1mapJ:i5vb!)[*z}rRih!Qd_Ins{^vMnp|SI7&sQ(YBB3,HQdNx]rhJ37x!sih5/0M@7}thL<vK>91JM/6)g+rc*6.tF2vvi5&J90*aT2,sQAViTb@9vqt$/z0{E>Hji""G2{Sha:jWM=;s=0+a^vvK|0@r6/{*.3~DTG(m12*K.GnLTY<WmpJ&Mu!}thL4;;?ud|.v&/y$@_,7m6(X<;^4m2xW~?Ly<C9U*_{d.o&c19%Y.7=2P;I&Vy#W%wxCg:|H=a^@gm/oQ8,>HO<;$ehiQb@ap@5e+L_?N~a>EjizqK;7$/{[=^GxWMg]8>PU=x|YL_%FW.K<fm^B5G["2r4vO0jF5YQa@dfuU8t(/.MGdqc@Maw^t&"}4xfnBW0b`9Zaw:oBrWO?CWa|.Y0,RDzC~15zy?.Zm6.VSI*$MQi1+*dH6*d.NDOoH6NX3a^v[}u9yE1,2r2yT^}g.m:L9hi~2Wc>+OhG:c/sZ0fg2SJv+Gaey(=6+*qG#zPty$/Cj2W3XhHVJ*uNdw"Qkg70%M[o51J,!$qGFc&CdRLoe$uUn%r/5<5[G(tg)^C|cxz$W+P9O,+8!FNrON0B{Z0ru;Fpbwru%W()gRfo4}QU64Nu_V$0e93Fu*u&PPFS3h@U_8UX3tLwxjTSru.=qt>.wwsQk_$[?^;C[h.wSY>%@XTx7$DL=52pE{$hI$[AkTdM#o:B.V[U+7?f!]QrVj3_Mm1d=eN6.*gh(J`n=aN/+f~]*GG65iS}u*du0|fu0[RM|84+=aaB/9;G,K|9RgWZmh_@"l<^bi_=wnhT{$IY[P37o2.NUvwb.NqVZe0[5FNjVm.0f?Z]5HH0z+k++Cj%_2S.Nk<^@7z<rx07Zef7xp[dhj{hvE}qGcHP/=l4+=F_ajRkj`v^oed]_qe2bYl[+YhivI,o%Y.VR"Zy!;KLp88zp7L7b7G8*%!PY4yhigrR@n&jaJw!Y1a|OToB?RzFwJr#&yQ%@^a*zRTF2OVr2RBmowjM(5FDI,2Ar?15w/q?Vyf0]M@*aEs?8N}|bx;g}3`VSPvQmQ3[G1b]lEaJ,bV!Ymj/[@S(;&Z#+w$*zcMEMJLYD2EIY7JO1=m1DT[5/.=Xcc6}Qw{C)>HHFM?p8a0kaYss[rek:AG6YaH~>2FI#)Gv3`xGSbH<0>)w_z*GZ(1:ke:<?Kjo8kxf{f{A/G/I0zNbR?+zrT_WwM;lNf{g{zNntf>whefGco(*!F.{@|S~yj@wTo~k&X?l`UW,Po5WZ4Q!%FhMFWb;)Gq_iC`/f$cJ#V+ebNe0D}AIp?|9BNPj)8b!`~B&n<`R9hf0||q,~#7EZ>k_M1b;86VQXcUk;q{@^H*B#F2Zuz;z0{m8Qct3g._AcqtTGa;1ZaHC8!Ho)Ykob.qL[uf.EjPWoetvIsT%@_,t3o.Vm$ouf::M?KxCb*aS[3+GohjG%LKxUf18(W+<N0W"+Ws8f[t0sI))d7/URdlr^.tRd7o]:q0yf<@YcD<4sD>o<5b%kv#:j^6`fBmHpeCBT_.T],[rlH3EJe6f)7a4TZt4OXoOoNDxqlL~pZ[b`UYgJ`iXZbUmE=TH91)ed:/=il*Wj"xo.4.UkH)CqOSK:l),@ZgEp*bBW,6dqhlu`Hx>lJ#A4()xgv5dq=UUV|6f??4M_aOQ!e&.0BNy`H[Q3<G,NQ;Ee:Oa9t1+GQHPr+P0wUBq1#m>XNKG|)ksnVy5l+:(LJ^=?|FVQob4r8{?V{NQHXz(UQInWAK2+,^gq/oDcH%M9,ourLJFc2OiN$uIR<cXtKw{E1BqAI"qMfI!e]{<F,rq:Vkla(w;ddYOS4{IvzmN#gJNorV:G8vKS8_BT.KY;Ba9]z/Q}L5f{NAz~P/Q}&/Q}O5f{etd;8BVf&H]iMj1x+9bSEWU/Q};W9]AZ9]wB58rc9]#wd;JyY^jHFX)(upHL.wk"vPobTH`BM!8rri@IVfvQlSn9b+P3O`IF;9X@z|+^O[n9H{Y+y=Kh?~l(`+Y`q|@T]$]zNc1BR</YXG6qgTFKR0j@bHQH`adcz@&McS28Jt4xC@yCgO"[#T.YFE8W3kpx$M[p~6[Af+@VF`m:sv}%<^PNgO%PnSB8IJ1xhDSp1kxZ)xIa/[oy3xc]aS"@C>mtIa[BgO6Il5d~fZvvdgp}&RgQzE0>`FwgYVzM!=sR#ob%p9]$3?lD%;jS_{$;$$kfZl_Y:*KWhKbPi=@>HB@,qJ]ij[NJqrU/5=u5W%wB@,udpRs[A.ru1Ubd5=R?GQWCP),"Nq|`7qIS=xI<Uqn5W"E"i7C/mR&NDd|E=B1t8Wt1|RR5J^WePD>AJmrir,:SB2{5+OAq)?RT"QHPR=]y`QD78?(#5E?YU)e|!I|JZi7A/r$+M4%BVX]CB:++ot/FL5G)PO/kV|Kenq=IEQU|~>x1rSLx94hR5nk.I!wpcUCG"W"eEQGBq!qk^sT%|<sM8oRFyvMW^=FpUJN&Ht,k^TbzyO3^L5Zohz^$%Cf9xnry.KIs3.e%#V+UWG$tKxde:Fm**{&5{ED[dE!jH;_<)l3Hg5Hq%x43P;"6R#zP"L]Cxu^W5(<&{egSY2/xW510=c9Ju8;5/*(b4L7ro#;R^k(2d,nPg,F+!u,kuSgrxp/*j1myxF]8UVjJa(YlT!/kcQod7!K&$j]ih33/5=CB[w/*}</*NduES&GM&U@(gm(185/IOqpWzHO!~M+jA^*;+$@n8k9vd;;#HfJ5@?9C4R.C|Ehu?{>kDibFVj;f/R`?Mvu3eu?{%Hmnr.Y`+e3xr!d;J5?+6TF(.Ewh3k;3t=~zt8e5RY7Y+bXr#/PRU6`R]N9SV*nElvA(z}zT6DtrWVs|eiXnEm@kz":b"m"0on@Zrm]C#_jBzO38{@2!2u2wO#8u!IW19N[4>Y1&or7oH&3*2M58$f]x+k$E`i$,RJ4J^iW1k#A[e%3c_PKH&k+IhYT>mOH6MLKdb?2t8Wt1dfA!`l6"5(>h3?#:oW&RKo,2Loz|~3|)qYv(k&J@W9MhFD4sK."%E=a7R&jrh^<;1obn+4=lrqUb8!8RM]&{|lQG;FNH9!Go=A]&*oy5BE67|RwRWH3jaXGI|7>SvWT[?|rw}yMhgY};3LauaZZ{C[:SV_8>*)06<m:);2A%]R~%MGaW$O&m}4`mZI"EDcB_C`a__6n/6!0Z1be2]j0:Lv0edQjL;5&V!z_9+%gV9N2>.Z;+>W&L,PxvzVonN(Vl(%9gL~Mr{fq+Cb_?;9{Yb6b=Zn:)3g%Z1nuUU6@,X[)&Wex,n_M9y3i.(:LP+h%7W*<66tcl1Yn_DO]*#wZ>~K>Vp_c&}xnQY>%|<:7(rk1V`VJ0%9DWI{uI1G`k%v^W0s$CbAe&mH3Kcu@$Qu";]t5sk&,c2A`cbwzz|&Zt9R7b>EUz~XJPzc(BBpJ7FdiN4+8:7LA5ZABAUAq7AAbLdtbXJY3x^/Zx+vDthqFQ@5ww8c@M[v4Lui]CxAAAAAAA_Qy4BA7)2#dHtw$Xd+!espUgbgq=@q.rA^DuH@iQ1x00BSJQ]6ub9q9c~rYnWNHC#X0ZG5]q@_p,H3,u4xiH$m^`A8Msi>%C}ik;iTB>_$9sGB.*$;rw/EU[H{IVepXxR=;Ghg[QaHF=)k,<[9P(7o>?(~^mc00XNIEKGwL(~CsuR@vQnbdIziq:)%d^:./*V|<p|gCbDcCV+qJA,U~Dqc>|*9WVe.i?chN;WDX,1.|%;vhGSt~gzG*E_tNhGBq+N&.tCW4%e7;S4w}s<0;dzR^xk?`,@s"z"2sif?yNBt$+3#v}g_McU_qXEx"T5Hg%OB{Xu.Co}5(*~a_f4!Y:~&$i,jjV*Yk]h1}OU<O}Q9{A~E57zppF!SvFcW;vTRfBe!#D0<+R;9_4Vq1c~k})>y9x;T"e~dBBEN[yz9!:5~ANj0weug"M&W$D94s4M;tFpR9UM20xQ4Nq#*|bkvq4b@+yFdjwcgJ7o3IY9o%.)J[rmw7dyWlHl]fz.U>?C$!O`NkO,[%:%k@teLuMIMKngeq/!B1xW/SXXj=3yagUV^*jY278B?f+w=g*x}@v5kr]S:7*C<A,nM_pD5Y?aw.:,@r3Laos7MI*IO!riH.SzP7eHcxR,^K9UZHT6<ZamcW]^3fQwV<W8H@IS>z@TU4=hI.e!j>$S8Npc=SZ;mk[H(bO@&{V(;6`mCq%3.~O#Ex,V+tS&b>Z)J;WBvcqjiMHNs!Ns%uzUc0R?@;5_Zi,c"=2;|5y~Q[cIRf(D:3K,}+}eu^cIiSV>.VoU{kSyZxi!Fg6(YRnB}zD"Xug^12^+6tzks1Pg8S|bQ;&DOby]O>!r}bDH7Y}HD_e+X$tcdmACeK?_kR#{2?JEUqE4|.:kxX2)zy_o;_ZykBJKKGUH9KATjb]?["b(:Kjn8y@^"28Wd2JBvgI/hM#=QYd5dB[o;*WM323.E)rNNbA,N:yUI>(6G}XGEIwNC5es?F<cXV_p2b}13SEQ>l+H{Asz4OxPP<>zb?Gu@?H:QUFo7A/k=;zu:#,QWW>uC9$Xy96ko@.aJrFEh{n>c/nR*>GC<k3E[l)Mhzl%[,f?N|^,TSx[@P_NdWNZr*s5U+!i)x]o)0OP9yn(u)@nBCeK&eN_/!)C|)SyQ.dyLh=[jrTwLG!b597~5UO:,!V(>1_pChqO{fGrmf></Xm&xP0XbIC5B{~[6KkdxzlWHCoXWyD,4r%nc&{ezNgjETk%l~ia4*tsnMdsf7A,Ftl&%t/vQ?WgD>h"I;5s4z9h4DY0n{@%#e]OT_a6i_j14PXvW5qI|w!op)kwMgeH(UX,yr(.c9d:&^#edO_LDf6_t&Gw~Kd$3*w4*+.+)*)MBvS0kyd}^K`m>:k%4feb_N3`EZ*^vL%JE82:,[A_F5&A+dqeGcY%LgI^5^x*{)By:<PuXF/IuF`6wvjXujB:rXQynPK{X{tUcaZRCNF~sw&o$1U1BjK.0gJ]7NsJ`H^H:/#IuDQ&,25^~SEKa[K_}ZwB,{yKK1`eZ~it*t,5@01i[.Zf_!OxpLft}`T|Dm[OWwg4vf`ZUB`sZGt{,#Cc:93[aF&|4|bqZlMUXxumq>{s4Rbr=R9Th5>rpNqQ:8#HD]cXr6C=b?Zj@LN98gD:?$S_W7%K*26!:tr,.%^rds:/zfF>0S=.v6EV1z@{hXGM!8wK;kv]g5#miT0c_fac!,6Sl2#@q3X3)X<}?"ay0A~4)iOM6IZDx/b]c_4#m(82Fo|_?ac/Giigee8ny|71F7Lh*sA^O9lOBL)e]8ymwTV@6F>yUG$`pf53qD,SsKZ{U&<Y0e(FG?qKvd`[~d|MDcW@,^DA8|^D!;=%jBqFx=I=Nj{%_pp?,!&+3[IkgaLUUCE0vh0ZTMEm%^28`Q2MdR]_9IJcmNKnX/@swSv4k#1hV4!,jUQaPd+%p7$tw<0FfFpg2kW;c;1)mRjN(vBZCty|E0jlhY`kXX6ZHJVc97r`X//cGm;}k">MH|zaOV1RnpvaH9<L*8*9w"/F{9!L.J%D!au000<;pGLXV<VQqk|Q(eH`=XcMd53>NA_C|Z55J|*FIB@17)7Sq2U1:(8x*+.~Yz;/Zort>@Xg;zuNo`lN4V[3aas~fpOf8mE}RE4e+.5&lmXoo^;q*rRoNJ.g`=MwY]H8EUsgt,u*UK|]G?1(KO=QqiG:4n461,L4@=|EaZOFJwqAH6;^W8;f[[u[x1{~`5#K]en6rEQH.L/T;};B]eX0VMQI_(MI,uRx[d1@mR~p9_:&MHnmocBDpVZ=VW._N<*L5o%"+Z+^9*(Ficp`xt[5jvI{Raxx3y1(p]43b/xWKl6:ioa@VZu|SOO}1sts.*r!["+;n29Eh#0Fj+bENY`Wb[p;$(o6O}*?pj*+e]AcL7.9cyH<.$Q]J}b2L5P7.O^jr;bH9Vk:?6X9m4QlLrgFGR]HCpuRY)u5)Z:smS`xv@t5(HS<j+>En&5BbZM"<2YSzgbHU8.(fIe|Z|MF>?z:/[7<kQP0fl}EY@:Yb`c%e82}jQm7O0Y63!)k;XEGQb>EMM2g&i4/t^X>ou$L:!q|3]VB!_73($iq+tItkbB?|i)dVDYC@KZRZC)%?*n>[c?YS,Y2m0Y78xy9!c;CtE:BoUNsx9/r6#WVpgNX=3o%&2d{)9b0BDnHC]7+,"HRIU6m:qpTyN6]gS2J:.u|z6]hp/5Bnzz!}:zO`$e/vxFMV5<z{?#n!C3!kgW|C(:#4,/6Vgd3Z!SsWO%J+lTO1}l`2+tTH}:(mmexQt=mlcb}VT[9OhJ$pl+i>KIZAAb5QAmrk,(i>/_g%glW^c.&?=NC##|2cv*NQ[WG*5o&7SsBt.yf?1@E,!kC.@NXRm%7}~6C_K02m0/rn/aVK"*hkO]oy^^8)M^`?){WDxaCCKufci9[zp<"sK&"cUCnx,>c`zcIk3N!QN0}2/6$i8A%&&L:e5VvmN81]72^EH%;)v8r?[=o5akA"+Afbl[wFYQmmsUToHf6*8gh:Qthm1n~icEgtMM!i`PV`VYhtuFIJ`t8&e!6:t)"?R4}EH^Y}nC{Hfd+?~*8l[+*%]2fXjubD[!WU_t0[nx;)JfKx@5[EwZ"OG&"WwMK=1D~^X$;kLuRfB18dxtu*@WD}0&rGj}hT;c1{*5eH{rLL8zaTGHS4WNo6LH{,^aCm1(Nh%_F]!(kTiCtuTH,0AG({XsSGragDw&S`0"Jft5%i"x76O?&`h,kvxS>wNLdH%G|eh2hzdR#pp4&d!i3sf!gw5z9mL49R6P[H0UxC#:/+cv(;c@Gfe@?ne551rl6$uL>,;gT][tWpjX#RR@#8Ez;HY;w=U<X[/~(w!RHz/jgWd".O]d(m[smp;L/WCDj?,E9==lDD6NsVHi98RiU9m0?C~eh)xu53)5`ENXD>>2TfY8oo/|VhU*%hYq4n[7#+z$DRo1XB)n*l1kTm`)oB1.Y/~Q.t</K.;?H~|Ux@{$us[9K"mJ|rmuq5T.C8[BD/}0AElLt]|`4tjR.2p[^XlQ:k;0|IKGyU6"u9Y?/vwU4{)m(icXDUco<jtSq67CP#[Wf^G:jmwQSZ"mS=4/DKGF/=tgNo|xNaw`LB,}w!$16JID~^{Gih~LhNNh>;|Wb&_nf6;43U9I5Bwx4EZJQ37L*jk|>^F;o)6=xS_MW_~.JYjx"CC)_l_]BqvFh0MswvhPPOJd74&HklO+EiDby:OBI/*9.1br+3NKRz~OWtn<vxqt5}K_pJxi~~,_OU7<pP&g.j3(IF.SP1CCRc;{UD9%BtOXPK]W$pXavzGta:lE3yD*rG<kia`.)vvu"7*L4>=V#D<!yQ/E!({bYPQTU5"pD5j=:?EGzkH[<Y<Dp.!`bY^DDs0*D914B96GI^T3N0YoGRiCX1xW0xc0:e!nYR$ZB4)"g*AZy^#On12(RBXYnU,/lZBO;X[8wV76,*5]0#h~5TnDS:UP}tzOa1~|,ch<?5A7N_>_GPhbhB9[s.y]j]RN=lJ2B8.$&4qBY"r]lYUo;7FziN|lVioTmOQER{ch+?Ur)B+_=rdha:i._C1$QyvdZP"HBkBck?Xd[cVvQto)+.?5[Ja(;QR(!S?(YWsF4<(p+EVU`y7Q/(gfstp4[WMnyv,?gS0WdupS>uuN6=!:?{MrQ[g0[h,WJV]/QF8k4}_3prFsF8;)?T!UPmSn{kGE8AU,DRMV3`u>io1,{)%kKJoC[O)[Q>Es)>jgxk}ohf&5_jY$eVTPk#FL&YdW69?EpQ{q/.;|+G>QLn/<W;KgFGEF1LQzf4P#]$.d6uS<q.]s_jFNmyLKk^Pp/~FB>)#<^McaY=X?^36w`<Hjq4x}[<A+,fE?e=NFUPBx`Wlb|~|Zn~gfRHxtbQ(ztG2~66Y5B{XrddC>4X,LAFdgU1YHZqu0C+Dm##a8>g9"`O9S4li,j&{7D/CP`[Epl,4YUH=d/_~|$uHMS7HrH9?HX^Y`)*{#*m8tVW_PpD8,}ep>^QdK<QTlY$%d_agQ*8/jzHxH=%LndS.HTUvN:v`~Qj7GVXL?lA$I$qaEyQnmv?so<@^W{zg]fSQ?"cdXp<6V+~4i@!B8lKGEUa1gFm<ESYM4PG?4PZL&5H~[B4bE!_>).fST1~U/^#kE*zS4{%~3g1EXShb:ca%,=[W}RNzN+NM"7*S`Uja`>{Tg$;!0OT^c}?U6<}V/3+xs3.}Hn]9X@%swvDROkH44*H(tyW2uLtvD=FN8j|}e^$?C)e=YdHK$A!EBJ<L,62VzCg=x1eE[J3m._z*#BG*BzL9JCK%6Z2~0.AlFXr/xzQg]`<.Rl630987@[Q9+HeqrBQHGe:P:I!gk2B]*Z7wPHz/Xd9_{&TVpB<37cO@nu%pQe$R.iIt)Zl!^=1|>IJg?WS(c4M_T>vcVeTVkHBq4!,=R^EwNA;Au[PHXsp{Tmf,5/*Ctia^=gR;6Xcn5eLs3<7XhvZ3Y]m8:@Tf&l)zwddMXcTY{f!qfUHCd,$*ETH?=d[yG2P.O30">m%5DbYGo`F:cS,aSr*1PT,rz.IgQ)(?~V6Q~h*`OdJO}.cQogD+]:*aL^$)!Wb&5*:qazfoH+/c6.VCcdBIn|{ydz6XPd]2o]c}"]dP&4s}E"bMJu42EP:#86[|)z`4i*sW$>X_?p5PW~P>`O{1E3c@Iry/7@fd@h*)++u!+(aah7v%,rovcY:Y0y5JPT{5*YY5b}>UXn#%JKNszS+?9benGaNn4Vt]5OZ,(Ny9jiu8<S7YDrC{Jc{Y)<WuiB)_SsZ`~QZamfn=&_`WRtJR"nH4fyvNF/}:9Dq8YG!p%yO+:U6zQxEkJ#|x<SC&RG#;aojZvaEV`+g8loOqx<wz.2i,r;ZHT,N.)w@fL3!,i+d7lQfi$Y:9UC$ZDg4[djCXLJ:VZl+0zW_,gRpkYeD,[4!ZEtbR,|3GWU{_~v5sgNi:^Iu5TtgX9jnL)vU$P<q!T%6#+7oN|3V&[p=NJhC>)@PUwl+eYPN7]"8UJEmgh6]A/J/dd1/P2"Oh+5XuVl<j$7ge3l5l:*Q`Gg!D<(]YWNcCD`D{1Dbd{#uG@_zHnP(O<6fBM,hE!ZGTi^Jqm/+.D!q6/.@N2N[NNHhE9zwUUJ,{e0UC&y!$oDT{r=(<RCPmQh.)|+UY]|Re}atw.I1v+EB/pOZWLkwqW+:mvDm7!bXW9oSxZ>vV&L)g;%Ne)Q&cie$F+tI0Z#}PT[S6b3n"f)`aXN{%u?WsBRaJeRD8%nQSix;;J(ZS%;h$Wsl@Y`H&:RoI!1(ERNdU3Xlp$(`&sfn;r1?&+J`8[$9TPf=sY*DkKlmShGtq4_4rP|Mfjv4>uL.5El%F[ofVxv7M5Qsk8p{uEw::9A$>|Z3I>[Y|X_j@6hTer^.?E~c2IV_A!eB`4;JP!)xRp{,P|FCJ_qK&h0#<!U/AlkM}3/2?,0z{.X|+)m@)"0q.q<:$2^m?ruy,c<nb:(DcNtM:J=JAQ1Gyp,!bLG2@1QGB7E[6tm#+W"}qeAf`eXQK5I=hsL50Pn2o&J5t@A!z<t|_ht$e$tLEVsbL*%9D*dh|0u>S]q>sh&VP}!2i:Z7hv_>ENCSfIx%#{sD[:4Zvvr|=6#C3xR;+k#M,ITX+Zzn9!*>Erdqfve!jy/<Cd[Z`w|Y!8z!<1pi>${)02%brfsaUH#|xP;R|`=VO:75?H>&t,LOj;:Zkb!eKtebIFBRQ0F6X&T}=:06f[$CMce{A3?:"EP0@}1<~NPI}J!in1SH={O)6=9yN)vvG;A)(%=G(L678&/IxM>)V*o6=3@@70c6!*88"AD,w5k#F|$RHqtuTWs<0TneVnP}c*l2OC]EJ~HwN{?cqk@6oZ0Dp(USHPd>`/>C;0ge%Mr7>rxH}O;eFp;B({7]]"tbxzz@Zd$VJRv^m=ybADdl=E8g`Q8OA5JyOl{qp9^hW3%jejPW:FM2C6]X:o`Z>3RW!#.3Am&Q2&2S*!,1[1]!jzz*1?Nz%j0ZZr;gH6GAf`uC[RYoKv!f0)Y@bD*ksU^N5v*`s7m*I7f,xga)6m0d:)ou3sS{"Ku~z$j3Qedq!2MzFICihqXcOoiN=*cBGTK*yHFXHhf/pJUicB}|a8zMOc{GZb5ddXoBEC?3jSBK;@PfLbeDvFi^})&Sn+s_imCIs:ak`;u1,JQ/hC2d1aoZ[oiEGQO<^fFvKG$[j;s_/%;TKHQgShEz1@BS<r2a`,tzX1i9o/C5hC/x@*3f"5*?>t[as5"7|g}gzd#,}N6`4@.]P~XfGp5PU]HR0`Aem6Y}_6?XVO6V]p:#Xl}8D9v&1Hn<r7:skxBN%uvcX>+(kR}WZoNBED1q*t"+NV@REWMRw|2+]bYM9o`V"Fi`$^u;b#4i/K?B6ZDja$_L,Lb)F2gHbq#="Suk(jQH+k|O:LbXhihZVy#:Sazq/|C3z06_gjw]HJI_2#R$O6Z[8>Ph+G4y_R0=Zyu>i%}8#^:df=q]9AD^"5Z*mz<6u3UUi=d^kOv_b?IvQ.=%6DspuYnb]zv`DM)d`r#VIx]0jLnXQ@(w/>~Vd^0dDE3L<fgozMmS1w[9SM/gq>63W,qgO:+Gy3nfVwm2a3J6vT#eA$"j4bHbjd$kEH}3!D71313rkNgH+IvbZ|oJQR;jm`xNe77g4D~wNg*qq5Bm%F(V6v~,hL.Z~T^q@5BO{NSW^,d4zZ,xA[11E>hV=NJJvqL2aV{CB![l"[?FZYoxW[aqngNMH1Qn?$rLrYRg}z$|Zk,!}IZ9Z7&5}Xg4`BD[j}+nYp<IIbqML>.Q_*<eh3xzG[I,UjaQzl_./u<1dy`pUKXmH3zPg??)7a!)<qeC`*9H[KOyOChm9AhC(1XnjHmk4MrRlDMC@IFb_1bneu:Onn^}r#eW+q[Q9#YtL_igVV|9Q^bA?9WY.gc[?*v+LEPreb`ar6IT2aiUp5d5Rk|x/W&|0mYJJ<XQH09Xf]^IWKk)%"%l?/4igg,JP5r^VN#g1pJ4z9S|M(|w[FI#wk.:=(}9iH#p,0);s1<&<_8uwW34kZfR+lG<>Z"pZ(O^C)?,00sF?~?wX[+XmK%t;(%p3WDmt/$XMe?0t#;>)te(]/(aSClNzs55Y,z^Yucl;DsN^8Mt8*O]@N#}(3f=$l5O{3PDW&K"3C04h+yU0i{EUCU^,W}llO#79|EH06Lzj4D:Mk2&$f9k[kv]by^JK*&{y,*O`@Zyv!~uQp{dOMKlySZ:Le6qtD@MaY8RFJy+[aoyW+5!1}lpa7jH1rYYa,@>snHfgvlDTnb?fu?CY9#u1$i:%Wji;n}.8*,!uV.Z85vY@^/(OO+EiF!|^Q~RAlLNGTU2+K,s!VL=:@kYSgcb6|9?=e#}lnx{tafGza7LT]m]Wc/7ayskmrxw^%$d+r_2#~vRWC7kC[@09[*>bd//+1lT%UYZ&EJ?)dTakUk+vc`N=nvi"6bHw][V78Y*d4ALDZRgfajk_Owp`ubGB=:`&CqLe]8)$L?h:TYDBJKHH@A2t08pBoayp4t1uEg9:3RiS}g]&dV#R;R]>[xSUF?SUmTr~+c#,d)G~@DMK%Qc6VdmBWDuW/l>04Pi;``QPOQO|EYZXvF2;;8z{;o9Z*$JnuQ2{"MbzVA);J0k4HMb%;iHu3sRBI6=01PpQ|hH/0Qb"FuB$OVVC}PD|yvtFdr?5;!&QyhTOC3>MALN!{65()*,{N{ByX`8,!qx)G`N/d?YaBtPzvfAo3o;;N=uHfrfWC`2I6eIyb8$<!b/dx+:.1cK(22?p]`xLCkpR"Z+Vk"oR^o}W&z~/PhYi6dKU2F:a`ar`;E<20iOXe7OOZdnFDW*=J1RiqD3uX7Df1o(g8B?GawK)L?vKMa:D{rH>%&(<Y/}AOo7fgRJG/Cb_WLH,5/U>)3Wr|[eg>.:DKU6/_QrQeL9l%?pLE{+._n!|B{IC%UcO1d8scjsI}lWyF_.$%J)7.[Ks{FkfM!OG3PCAzFgjCn(4*]Y9Y]B^I(<?bt)!5~.IX&^km.`}>?jL`Ru&39&v7qee!Wu(:%.p+zho<dTq3(o?`S_GwTg#4;<$$o4IM%oa~OIHapB/<B,KAE&meR]mn<MI|nt;wgBFezK!b|ajby([~A`q%QG98Y4)mb~L|jA6BnVcI5=@"s<Mw=1C=K3sX|R,*Dp@NF_dX;$Z%S:;`{h"g~o?vMQaen=]PSl;,sQinL<*:SRk9$;erL1Z#n:=`hTFE}ZHBH(%);OSW!8t?5je`;K5}C(nv<=8,;a%jC1vF~5Y6F7w^G"hwa&%G>qg}MP_IV5#f6YmUSaUiU]gn"aMbXe!:BJ)ikHP|).qL39f.qLjPl;;6i3{jal]xFDzL}G]pmcI>tU5_~6p%NK$psx{:D4xVo@qlqM,VWT86DH7IkPo/i#3MLNxfpGmKPe|8l.dE^y.rmzpx<nBh+W`/4GNZaErSX<a?z9;$,eHD#P8QD/U4_Mm[2u+8:X(".2sDW.(USKP*<zFOF,rv,R5=*"i"]un|RWXc)qvI^,L|75MMCI~C8YB{.dXVs1#Qt$f4AAw=lh/f^u:oCC?2:{qBYcq)fWo1g]iii#Q(@6I;[t/UGrwCd9pehC4IA_r0pCGM=dotI$0OEdXBZk4GSRgQ|J2Fe*"Ryq7NPYz!cVoqLin|r]^fYqz)c(KBI6&$R)/<`,$yz<5i6ehW5jcfZR_Z0z>+K>0rc7tc^frk#Zep3j*14)LlH9@r)5IlVvZILxpx9x!K$CDDSB@kDVEzg}:v,$/5RCTdItVD_(#Z(Q`vK|CSlE}Fv;>RIn`+_9eCq1P"#JmYXd*99n)QZY2KBp!yRo#HG5yZgETrug4W84}/IYc!90doD,h/f(J|)z*pE#}L*UZ7^f&B"caMZYA^;T#t)`zmb2DH:%J~odT.pm?xkfJ+)2=)lb=n@1~gg0GI/!}C}nZ&m_$.{$E,fw(fQ:||7dSses{Up5g1BFIQX6p5%:rkd3;rA1]WFOE,lDRQ7O~,1X*.gK1skuq&b#{_cO~+.+2YA#?Z!2v}$3)BxInK.Oo[Ix|;]d#w=w=DVOC@Ff%0A"J1tL"H;XF[Z7oe]hL1,2XLH&~dhg,4}TfHRU%#<B+9Z9rh5ZFCvMg+8#Cm=B/oyQ@V`n$*J+[L}cbm,0qtt[47bh]`2WBLx+,*&D>2@Us?^g2oj.+n44f.Ygs)lKSWyCqPU^zs0.;H+w+k}EDh51F;/GaumGDXK>rH/Z$I%[i!V}ld~X&h(xTj9tpF!/rnhvxxjsQc=5zw!pEeAq9VKA{41o1N)e?X5HE4dCHucsPIEP5C%zuWH"P&VC+/w4gw2,5|/8$wq,|*W[i<Tl1%*S7v|(j_k!hj@x7N}Tl.7i/JwRGDo`dN8.qUZm;L35f<MU~W(ecI!g0D)*JcO^vu,Tt~7{O8c@1KY+:|GgLf[[Tt=j;Db,wyba;Mt[@x!A1!H1_5Lg@l3&A2#/1r)6+N/q8;+aa$Hit;@R(k`B6p^l4OM|0yZ?@xv*$IZ^T~Mx(Pwc#9{o(V4}Vx|fMp0[H8z.2HpD?nHxJ?Rutv0m@llFa]I7d*x4,>z34E<!@ydbpJ5H0&RZ,kIUdtck>!IvPe^2:mvrtugGjx/@<9ma2Mlj&5/oQYBvB@!f^.qTqMRRAey[Xy3YI?X|7Os_M=*T>6?c,ea%(xmT}y%K(,.3+P+AjM`qnKy_ElER`J*sK_aULExQ2,,L>LY/h5#Y3s1UgeqY7rC*5DwVb<V,|/d}jh+[zPv8.guyFhl=ZuOjeh|u8_3<tqpWR?lPAn4yxLN0+?RinM[6.KK,)DbpE<Q^3bLr&v!NRpSxP(}ZKzG[[2GYt4nBQN}0vS/[Pfp(v6H4Qk(:G2t{JUL_FHZAHz5azvz)KNCaemWRR}XA}0Qsn,V[n|2=T3GLrwpyy7^DWQvDa3(7ats{bqWb4LLC>;&sCRPOUg4";Zq*|SYkA_)/WNkya;$@#bo_BHYAIBE2/Vx{!u+Hqq3>`Tl3z2!8luY9zG~k#5!aBG!40;+ZI9^2EEn9!mc2k^#oJ$,LY)tj?2xHM/ngoP1|*8q8~%peUl1{~iPYp}Fn{x"GSfI;cd9!t?^`~Ne|A#~+kvOuI):a1!c.0!6TRF`UC^eamt$$#I3rK!dE7y@^;{/poF`IqKve7[m@S65I!X=T@R4^XyOoT7yBMkB|0Z=R|#=6X1_~*OO>{T6E(bxBkPU4G%T<m.pyAhK,`BSyd<kLAjjXmk#2cI/90*|H>M}:/U)HA=j2cYD!T:qbpZx|W#Mv8S4i30Gt@V]nv.g31kf>R#,7j=j=7}/^?o$b9Y+f_lU)(iY}}JNs~.^.r~kW8!!^@gG3s_Me<!g_?JeNPL6%`a?1oel?zh,$i|X_3q+R[n.K[Qau,iPfoR{[3M2GEwIzO9rF:/vo)=HW,yi0DWvKCtMu`.qsQ!E>6E?wL`=`#_[/KA[Lw_+loR%*kfJw{1QF)jd7sJ1yDT.({jf$e]6(@[(KjqV7U[rf]YDhP#0A074jAkDu:dBQbw$>;GHxbuc%m(ZzuGOeyXJ1A5gIjuixd[EB2@))oQ;!K_@}w<t4/_[ra`RTGZ+]tIpC@V?$TiIqze_s8(uv{F$$.p._N>g.U=dMC`J/p8iYbU~,A0V[J$E1<H7Z$ev3?KWb^)07p&pz,o;$IZq6JQ"v4=OMVvj?Q26tdRU;`X0$zk|F_{Bd@N.k:?+9RWh/Vo!uzXSBRG{cV{+vsiZP{#"+FeGoXD:l[@@6_CoAH6~xA`@~zUIiuvCZGFW[bWR%JzcChD.7%baN$}g4q]qt*?w5r/$Q57n;j=4`_}PcHg%~U${l}NXS)u@(v]A+]MT^Q?z23iDnZF+w~ow%F&<RxtCfOFxrWLjt20,nU0SZ_,[n|xh:J79ArS]t>;Zl}a9Mt*;;Zm!W&v8,R@A{?iW|;o,jJWSVwQQ3/+HzdHCG*Q4Rf*1SB$#C"`~Gbb,rma;,g*AtToT5;!w,bkRbfbTQle>W,*Tmg8oXeWu0,Op%4LJ~N@:bPfoTSg];y3VmRHH6AT7jG:=pjgx&xHGqAi_e/?^v?aCkQs]wi>^I+_Kz)jA8pjW*=Z^^2Akes|_D!|BpYS?Zp`{+Iv(u,<89;^|qOjxbW7~Qc&0>dd!9KgkaQ<{n6j.K"2Wk8?p>,r|h??)si5$cDa/9hm,y4Ss4$GVw~+4E4s|"WI4%,=zWt.oz@%vign~50UK0wWw$bhU?ZgU38[1kA,@8^pIsnj!Zg+pQ&MfxHiT|Y_<{{vV0~Gi/wPSy22.`|.lI?}QC6=|`~]LU@_wIgbB+D.pm.vv[DN8E)%1hE<.au*(S"&(3a*qk3C?L:NMxBGJ?X3d7DeYp0hkrM:e{|d(ib)!~L(e7zR:gS8O.0[{eK]vXr5$1,}DI$N+B]p1XZ4"eDd0r3D2{eH+(:bp|NCT{Jv[/V=A6Qf%^Ow@HC/"luvpe=BMIFI0z/b|2~_r)Oy82M#hs)q))IgMox3TF*Xj$|:C1|N3d@Y91p%0d,ggemOU2ls4p,rU`sK@|^mA0^5KDnrKi2^5En^~:W;8,xh^)Fuq+la9N((MOKcRm0p=a1diY=ewwNa{IR~i!D"=ah,UKZitZq4_9(ORQ11`piv6VbIf+0ugm_9,]d2br.$S%:[`dy8RUc&mgBSf(_f3se+ly]Q~(4(suI_[";y;IG)X!d#/k,ibj.Z42RMZ@ze1|{08y)W{nW1[$Cov<[Yxo`1pOqAaf]yBKhctla@xPjGt,BXn<apvu|:*y=m3qij8c5p0p)pJU1~P($&jmWOZ)L4.gwEGL@tBd^`Td?t&Kwj=Fi2O4Ps2ocL)~~j2#d6BQ_8){jdkxZ8Xe<,W.J8O8"JEm_T=2,Y:,i!tsZ=b4kg]!iYu?=qtMbCmzC75uk@ImU^(Z2C.Pcuv*N3*K;Pl._*6pLS14gNyaGiNrfT3@J1jyq(wIbqZF5_D?O/#i){+ip3R@Rj*tos7Y#EW+0G},*l5<jYo)[FnGg~0p0(60Teg$rM%d.vD]pQx?2JCE7T>6S0OE08]bN3pm*Z%Eb@(@f9I<RIrU$bkQ,%r]O_;goGq;iF9gXuv|0SblUdFzCMxM/{}Z|WS_c,Uc;nV%d7Kj}08KcRrO^?O`5l0nXQ6*6&$veh)$NbyIAb?<B#w@+Tl<~GsJ)wM&4BC7d9bG<rvL>R2ylLM37#K+Cf/5C2IG>C[@yI&)P,oJ7KM!G9z(6[v[Z2i~1(q26=#XY9c"I;W>p|RIYL4uBxd::aB8NJ@B;KEleip&:o3:u+T"q6.:frCk;M!p%x&E/$^A{OF@=]8*/e`g~7XQ*=a*Cre2_XnIYgsI7oVK4KhS42Je{_O|M1Xf<X?XB7,Foz,}kM!/GN7~,ePO;i1hjdX*S<6;*bx">rF<3MrJk[x8D[%gjQAig)ob*5,rKZmLlpI!YHfH*Q>NG"2[5c9x<Yx;$TVv&_@jgy>;=`HQ5y!u0Dz42?=!yTuI3MKse?fx[CPEFa3J]"h#f^D7y`Ha{&:2D#oV}i2(Wg^,2W%CME!IcN^vsBa?DdD(`z:SJr]#_oV40aD&_[2"Vfrq$FNBJCf?)?OCJfRC5Lg7.e*=Qjh:$~/5.0]~hP=Z)^8s$uL+GbWvVe]O/7FWM8)aBYD^4SvZQKd/9)u@}14^TEw^o+60I[L~WsW(K(gXeZl|=:gEWa_:w}z7WX~efy&w<2Yah(n@T]W._hy|EKJGV<7N2TBjS0@!$sLra)~Y;?JIW[ptX=O=Qk+m(f84I7{7`c+5txUSaEH2NtjG&CX^H8aoMzv(T1/@qX~2"lh&zU1H6nfS.0@Qs#{C+[~Yn`*BEu`I9%>&Tt,"&,_P!cnaA?$E93M|nD)5=oCLVEAKog~W:b#HU{,HC<U&TF%gFt5;U)>i2R2?YM}%jylw`,c"iJ9#v#b|LD5CCC~3d9j&1?kaeYniXm551"O}i_SY~Rb?w,%xV.yaDVfUqzTtYk3jy,+ybU#<C@FndEwT=`Bnzs`6dLH!154RAxeY@lww_fpGAGP]/vU)bk!_1vTNFEbUrRSVVkb|xP^=mlM*67/g_)xkH$!~n|T}jxxJz[~}O!?H{||<|7{IoMSIff+Y%9X]K??6cJ7VL,HW[1`S+PpKQ*YAHSwo!cYKK%cno$y#!myvz2eV|zy8pXRw/!sBXrQS^|dFhi:=)GX|prDSkc8oA&8YBUT.}u[XV:`5;OWIfys3!sP3l%<UFjNqz<n07Ot2.C,Mt~bL&$Pd@W89NM5det(/%|_aaQRsOU/Vlh763w.QRFP{#p)cq(m=Psv"$kk(/Y8;56.vc5bYA#n/_ghdT61Bgo}@ABe;^Xgjsup@vjUpeZ/O)r>d9Ns;(fO1zbMYE8Ey+fv!zO9Z8WRp";+I@+&<XckOT3x(#fQE1v(^$Z^Q=O1EE;UxU[tUx>u[%<uF2wKTQ$X]T+`B?plWzk$FhIY?hLkZti9EFeNr6UEM&)b:RzaTq:zdMqA+g.4f)My09iWFH+xFBT)lfd/U:Z^QLjXRv}S;ElUqbuzfsBj&mORm9k5k<s{j*>fvKi_w]F/hJ}nl}02E4Ia1q8j4[:z?/{jz#}<;l!;gE@e1MC89I[+K#9f)JnN~B5gOkwU/ilZz<m_sA#sifY.o;8kHKC6SF0}7t*F&~5){VJ|3S154+"fOh^CPXD5g%!bSv]!pLlza?99,zN@u8$[Hwi4=ye&$8DK$r`5<1O;:DtR@w5^bZ9!M:uw~ghuO{bsm;nNoK373"Guct=eI3`i&j/<D%|`s},(@iy5lIkI{"}ft(3Je9EFo1ro~]Us{uUN#x*r~i&Dxaa?5`v6=5Z^NSqM2A4`(AXI3([Z}T6Rg!_AFe<Z]eK,j2Y*hM!X;}*i+`BkoK9+aHt_O!>Megs*l)1f4hYq8EY(fQQb2hnd7sc"vs&pm.o?LqTx:4c)Z0whKX75Sj$;*61#B,ADgPdUjKz0CS%/EiHkRF0.RAJo7BseS&+)|qR8S3FNq5tK_g2AV.>ka^ZoA@Jn,w$|Nh`tE"w*=yu1ORSybXo$dOj7y]N<I>`Cb=@TAAvDp~&QUai0zf[(i8rMNcZ%cK|nepX1I8=6*9JT7.M5bJGM%CX4Mb%yj8TfbOXYT*P65"Zb<omdHK$ZLFNd`^Tl(Gbf>LY}a>HM`1Nl:O"U>B@4VBztKIDn[rCjn#gNzBwUy6kK3R.kIC4)z[bAL=)~OYGRPHjVC7rdp;nxB_k.>E$vWGQn/o>c|Mv3Q+D~!*imNUNC{TuR^{wwg|0sYooL,tx#(PRH=b,%$NY5*Z)7J5`W8!6U/w!OvF/y^|(2"HZL/T5qbRQ=28xJQD"=lXl"2$5]6OaQL)ez;lE]i1Y;#YoG]W/<ry,V5CDwn}f2SZfFHT2~8r0*CW5tDZ;9ybJ(fA38e4n&!/XKlZhN?"CW:J{QpJ5:#f+bjwxok*r7#?OY>L@X*c;L3XxNWww$6NkuQcY;SjD4~#pJi+>22dM>U$O:QMRu:]:}kopx1~GosR1X+D,go!24I?M_RQqR*H"mgtbh|e8:aYu?7*5bsk~VAu>*3wQLa]+emOdnXZR+a^uc@}+P.~]~sqg+p/[!@`HXXu7X]yqR]]C.#?J0^MEFo@x*YmOiI!To{s%_iR;;V<hRBj65_Ici]L?pG$64$hDDvtll4P,:fT|YnK|C5wiVEiUD=+V](gWup|0Hr8!IZIn+:)U=|z;%HmA#pG;,zzTu[9cKJ^AGc{7aPz,3#j>cW}fj=!QcRMof1>z.81<]55qkL:FY,y*Q/5CcjLrtZwag_ITtjb_VX/#kPJX@h4U9{DRupK{.cWIXk*md>Q]c2H|Fn=yH[Kab+?c!j|;i3[1j#`GD!twt^3+DPX$5.?*e,uZKW3rpyH<eJl+}?(Gm&+"Qbs7Fuo~YCh+vt:W`/,ic$Fe%/.+0/WT#+s)lpMzUQEPRZ9,IMF2U23MNhIf&o.9SJ#NF4B"B466st(8yy6Jso)4e)W4+?v?)iz*@#qQ~{f`ujb:uC5ch>X#<2&5Scf$QG{"g$U#M}YCQ!35G:Z`[rMa2f44|$l[l9)V?Q,BAqQ3nt8<O*uPYWYuP/Ikr+&"IY%|V)<c?q6SI=rd51:Y7L3*M*Kdq;5]e/ufTN/>t(v{_I%V>1@X|gK>"O2DIX6I5PJeC8ySApRA+qcb&m.Mc`d,z8{rW)}M^=S][@q+PSB:MGOg?QFXs8F$+r`Z92_`yoV)a31qp*YIDAAggXMa_6j*e"Oy6cj(c<=q.a"OsZ:k`1^X?6+22%!V5@7<t@gOk]P(B|4?o@ujo[@~a$^{Ny9&v1v4AZy]rN:n~t>vLUB$~a?Q@574{hRHOQtV|pl{QukFmF!H,m?a]8nwiJ`RA";^p:a}fK3tJyZKR,3tqu+Xa/.!_K/JHp./~_h@64j+rwQZlBjs@*r%+6(];,i(P+ayF*ikqoOSth<4APP6Q~!/c2pbkM["c!h!+=K>n32S/H28]@?drESN,WW&kHO)*hGs>e5*<&K^6+n4sKfVLkm0v!=g&`QNwGxL`_1@BdYXF*$dNt}c#{w&YKb4`4GXQ0Q/"j>NBC>8QMF.YxP^@pcdB~tEr4u%|n0Jpcuu0v|lm/U_s%yn&PQlFD;L0N"Jeb24^e`*PJFX/~Y2+^5lO[K>N6>lYNuCn8Aty_K;oXahSyli=pZEP.C`^(:^)niAu^hq:obM9p!8#Ew3x9(L=_m><G@*:#xL2C0Nz/o!b"@!?KaUEGhK!G&^<vW|4Z)_48vY0_<!Rf)=u_/K?U$."ehY<lPT3=#Xl];NL:7U%}:.F0%{hsJ~e[!|92bJ]h]J8L6Y^CwPg@%|%tHCd6Yf1QHm~V])n1b+yh[aRy1>:w(=?s9G;f9)7)#I*m_}OZ*mz}</+$Vr(f]9luR_807@L)^2UI.RDb+gO{Yukuq/sZ1.!OGf}/;F`8aI,ITV{v/!7NL%>G2=wbFTQ7V.2B13{n3P{pjI1{u5q[|(XfBU:VN@b{EX%>:n5{[;TuH(*Q33kinJmBjT5~`%l({/*+x.Q8|e|U6G.!Z7H~9>IM{+md9:s8;N96Hd2bT]%L6}lS}+<&sh3/<~rzXQ)ih,pXyw{$F$(|$ZCNlUz(Sz2vRL1IEc40UXw9wQ4mc;V4SQ}WL)IorVVZ|Ja_]$5T)F+uiIyNxzPMAYJ;Iq<!_aru6G_pO8r6^9E@:ipM9KDBQ9S31bwrUMG.A^zxA%NpC.dP&q]b+UpPA%[}kl3?@m";&BtgnB|?DhHsRh4NLH^xvr/s4|&^)8oEd2couS$#Czg5w"%o+8x!gyrI;iJQ:xv+IK38o=q,X[k?|537}m1r4(7TMYBwt{l8ws^{]`ME<MAw.W8HT<Hn,Bo<YS4}5+[sthh.$M:*h29;mLsA>lK>F91`dq*1_IvqH@~LcVSK7^Ah|"oD<(JIL0KmKl!W.|8M"+sy%@R!>^1C"lEt_"9#<q$c>?y&8c0PT!.GSS44mhW!Pd2qJ"!Ai4tc{E?]E0hF=Uf^9+6v_)YuO@EuM!5:^U7h4Vp:+pP6^fZx1;{nY2r~aK@D#thzy_RWdgBoOCLj4=!sd(4dFOc_lDzfrP%ELm39f^_;|hdI&9AXhSys6}~GElr`|CF8=#wiD}H>@s.6jb>y}5fWb8eXqJ^"xGTa]3h>zl,MNGHLtn7Jk;.BQ;S1_90XsPo*z)p*0%U/}KH`tvS=$QQ/NpQ;!bqM[fZwSV>MfX}Hyg@cef+>Ze$+k;57pk1Rf8e;RlLPZc)ZsFzUo%Nq|77<+?y`~uGO2zp>,GEF5/0bPO3aVH_bX:9d$XE@w#^V#vD/S4WpLN~L89v?Af|hd}hrnF><9YDHOOFeG*C|atl(.]lTgJ3wu8?>S1]?I6|?c:hzVT?1z+f^]2J$!JsBaR:`WXW_[|;E*SQ~*hXb@^^kHi*qex,%}l*CaGW2=E?gdR2lJ#FXLqXp);mx.$usyy[ozJAHk^k"gXl^~<nH~ar8@%Y;b6`ZH=q;/u</dtS]nt3F=t|pG!1)i/#?fpgwKr[BJ[=z`_{)0T+SjmW@?k,bRRDYPCu</4.c75{gz+%_D4}H(R.yC@oH_M=enh}:L*aeka7@:c$Df$NWZC:v3M)iY$6K*O{L1BuiFv2KNctMUqBR&+Z<wMhL}!^Qj~:C,JcfT&fmq4ycdi(IQjtkvFF^s6Egfn*bX3=~#5|nsx!pUdK/p4u^BTpaV`M7^N+NPVeilc#BH2^Ijc&F5{?OE}f23*jC*$Jfx"G6@G]rKY1$3Z&dY6r&Rt9IyazJ86#?m;&<;"a|w,"[o~&9N$Y<lJH]VSa,C=6K_I:/@GD_@f_wrj)cr2%VH1|:!2VDQh)[NuE_YdpOMmjwe.!%m]gJ4I`vEc_Cs4`>caqhK848[Y?Qu#q#vON6reI9h[N%qT)0fGVmrKDa?3YC|[M0ghUEv;MOSH^V"}6zCNs5Ab?C%s:n%eDCc_wkJ)y|51RQ1[TDcV1|9s+O&?WY@k^f_iivl:^Hdo5Qz9Xyx9=]jY]XeO/f_,WMUW>{^Gilj,cA4?e}zS^i!bR{>,bs52`^LkzeGBF$gUmYcY0(tXxd]HD_YH&:(vnZ&hS&L#j&{:/(|I&8^Jy=.WsZ;+fK:mwlRyZf167`lxMV2.jwrdXHQbZTc@M"^FiQFUrRzsD=p_f0yAMpP.pddB~El;Tw<)nOq$08Ll#Bi8J_Q$dk&)fU&WFGv9Lm?X"i"=D&XXRO=r=,UiLF=Z?:gY7SJEk(^^|F~BVi`WZN&6Nv5N=$;C!r#0gyg&NrO9&0?KSoDlKUzgh8Pv97d;ru<DccJ77%(JhqUOv8LJZ[~Q@.Elq!I)?Q>$)7$[8P@>ltDIzPd$OFtmGn>e%6i1t^[c@@Jwg1~#5<l1&8r<:uPO>EwM?@dD:|p4Pe@RBnx1.wcSML".m~S<w[.STcfz.Q>K$To|SD_CU6v}=Oa>~9,RJVgM>zs8)2)#vb5]%C]{`M>m9y$l"1S#[tVd^3<EptXW_3h{UEYSp.:iTsz!|[:VDG^2)B=DDKVqEpJC25HWYzgKI|.{,SCa(Mm>hqw:pl>.(:i=sB@F5eo8bp<zW(UP";WN&0c<?ejvD[mIUC<e+:j}FHP16BiYS:l5yfY]C~N9&lEj4B#d={E>qhth%nKOwfiak[^}_>n>!hBH,rP8P8QAwdp0>)buH#qWmeN16oE[F,7~lb6,Am!@X{)?>`aH`NK[#T.h[qt]~!#9Rnq2xP<a!C8&pEuuA~3SEklAtPiaL5~{,Mz/~:6:sm!F`ot0q_<QJ5lhSqA#^TkNfg4)EKlHO5HNGmt?`b`O#WOD}jQB>hlV<9NQY}_vf_c=?`}7k=Xr"WB|EM9?wMTlLRh2Dmn%Wu1sO#jqk_+!|~GWX>C^ndBWUw{o,jkCq**VK#a)pgrBgk?mK%CYP8+x@rPXJ~Kqrxk*d:+,W;v.jPt+|c9!opG)9=3UsU0Zyb7%yDEIyMBHj,znP3|:1NAL<J+ExU2;u0f;U[S>/PkE;cK>%b2JuNsZJ2mMXJrWnLKJEW<aFpm<EY*+q*Tr?B^@9B!GB14T2@5S(qfG$[jbV`&3xi:*`kT51vS3AB_lW]oReN<:kymll?Nf~;Auvdc?EE!HH/p[Zi].:PfHAuffTZ)@8v}7yRa<Tj!lVtAjkI:oZLv~9HHm6Dc@6wi/P??f|0<E<YBg)!VECiHcfac[:{:b_;rOqfZ)7syW>AMn/lmK?wC3Wl9N!M8g;!9>}^gG|R$m,lVWJ0QUV1E{v.Z]vQ7pkpK&]K7OJ<<NxG59ILNiYVCbpi*YDZM[@J|"]RYT/4%+r2M`tj|?{]?uV`I8bkVa?pC(0O@^qX#rJrt(2hWT0,h{M2I//3:$R,urH*J_qT4#vG>K^2mWq[*C(%8{=5~^I[Z^L9US!znl&v*DQSAqwo.%a>^Is}n(g8Zc/b(s6g8SOE!6x(*^O12L`z6BOi6[5r,R#,m);{{q$dz0s]bTeaDZ?R2g$"XM:d;^Mk2CS1y}/^aN,Q&4mJ`Og`<#(b[a]?e%Iz$GnD"%Eo.^bZQloG{2:^GcFNooU^v&GzmvUt&lhLW{L@|;cza(qtU>2`#FD8VB9CRO)MMZps*Fe3Q+,_l;Zck5%_QzpqZ{o5@YQ{kXa>r/9_64SY<1g2I16SE/NZ=SqG@c$):`LN%:kvn6&;A@h#~`?2KKA!Gu!Tw[/zEQE2r.i~b&#4b4nyBLED]<4I2j]%X+7nodZYZD]c08bd1"c^r%QHn)]7QR8fK3FyC."Vqi2BO|xS@0!%EjN+IG;3hO$s9Mt!vhZ?`)X?5^81D%Qiq&!]FMlE^X0A>h9"T4p[%gQ66VIf7a3|.">}svJ#V)u`Rt"Dug(,1*xx5y^ZO[T@)$K@".<b)x6T}2)0I&.ytw=%Ik8t7>BnCldzSh)SmddIIU?.Yum<O`Mb7P4_#0:aN8;fPlw/OM1/^:15[Bxuq,+owK6_1<!2ZGpDUQXK&*Um/Ssc#L@U8rxl*Ch,O?jGp:BB=?|_N;EW_d&4Ci#txG]*R.f/Q6~HrXZzu7!+3=Io*}_4#O3@~h_nsU}1dE^dK>7fUvMFFX:=R+d)1l/?KxRCT^T:]`j[BB.TJ_x*xg[7KSV;Sm5r$:hv[qp)0?kd8`e|FSwaTRGo|rK2rsdjt?=DuC{zs,X<hu`nVH><6G8LS)apX.!R4.|]9lqLe)lYJF]JjGzH$31R;roNfoW[CDUWc5l];Pmq$X08@aKUuWG/XnbUj0n]P`%tr:0bi(|919Z3?2S={WX,s/O)y!Yr~Do~XW+yVR&d*tH=*NV@ZN*^!OBNMce`Dx`f`|i(sQN~`K}mQ"gB,^Qll&}H.@3QvTacp~Wxr0"+COB2yv7C,*N?Dda`MZMm:Qe56M85hTA(mvRT{mUA~(e[D_INhf&ef_QqxP|"<n3h<VLl!A6tlGm,L66J6tkPbzC1VQ@1?4%lX>V_Pc*%1r`hwf$bDX|0MQ&Uh>,&q(G][~o?DZ/|!^a@A)_{.L9Q_$2#}h;XzR=``Hyp#t/l4oLB_O+eG[f#~&)!`m|+b@`["9+KmzB"W~mJ*NUohtcQ%%ZIEhIQ5~[9*v2Zgi.!f#!9BTq`?KY2`~vkA>4,C&5,XH_;.)4pCXF.JLPEscPfBNHb.%^5qH:ge8K8zaw+@ZS[{_5#fa^`z`1fk{$Snw0%JmAGnC3qW,$[#Ra6WP]P~/Ck5Xcx[TR!/CiuHFk3s0mzIZo8bQe5B!3U7]%mbOy$@.C!nP+_{h6w"rQ]J$k6>ZLA;2"f~`(.BS+CHu)x.TRZCf#$%[VC!!~(gY.<d|RR_6`J&#ie;PbddDP*^R<Ya=?0S8e`A(7=GG1~05yt?h:[&ovY}9;hS{IHJBA.]RgOoYu(L|n{`94&)yK[,VvSK*|.BhJEvT[0Fs;9sve79z;1#k]e&"CU^^%9*E(5+Dr$}syH[RN`9dM%K&m^BXMpRsNQ_ql0uXN.z2{b5}c|R1a<T<FIM&.Jg$rK88nZ%To9C$8&VizbTv@E]7vt5c[O*L$t@!cs7Hsy]W@deLk|h,?}T1@K}3XHw%m%;D+}>+e1pNP`!HzPGN*I5zGR6[^M>/Dihy4p^xgO=ijT[$HuN9]RQO]0Gd<V{v.WCq;1aCVQUT^[P~ghmDqK~Y7Ghu0MP,^z/u84|C.))q9v+#|D7:o.o0NR/EK4~voO"Wt2$)wq[Ss;UNeU.c3aw,>a@_)FEc2t}0vR]2ggcM%<L5{NRP(?jN]ZqG>9#XPVvkiq0%6)NEA*.V:!Sdd/](D<VbT*xG1p6Ui_2S@a=zpJ^t8PZRr<Ab<cz,~)1Qyq%;XL1||%[azjdgfzNwIx=//wnOFW$Cp.|R0@q`1h`hHZe*[>`L,6H,nBqt6C4^AW@XViJkn:"SK16.dIDL7qL1m>qmLvc6*{=cZD44VjwrOWT2EJ}CRj0fqt9IYDMa.=~5=^m)%C9?D{a~j,)RrW,Xi6%!Yb3yn"m%#NoH_Y4w]n"Zl^wW3|.f>c4<wAQa"VCgnhl7m7%Z0@BCP,MU!ZAiOK!wux:b+kZ`=[lRC)I&}mS;KzE:v5>U[ccCe|Vgzjc^ftVIzj9"3mb2x4s_vBrT1yNO4Awn4{=Nn|#BRT;g@gZLgPF^?HcLg!~uF$+}%M`*5teYtqsaT5B</%b(f_|!kk>BIx~#&%!]7XZd[R8yp]v9!92~F2n7`1.^)>V^=P){"]4`QWPthh[BVK/v^g7#~R"7yT4;_Sk`8UhHTgbYIfqrv5Id2hOZQ|Qw#js?4s1Egg,oTHF!Yka/$_3C$+I7lSnUYq>NM%HatH$0dJ#}Y"j7sw:.n^RnkMf[4.sU_S[T~I7%FZe9`<nYr@GeNKlvwQ@_<v8w3YW,*+)9IexA0~]W0iHGNM%*?}Fb!}Z;vKU/swaz[D;1va,DcEw$upVow3@16[%k<T6?l1eMv!K:jZ/`*dQQYDS&eyBZUJpFPSx*.vI4>zVqD0_F<(+X4j6yxJ:D"K7:>@9<1~Rcgzn>hG"OaZrts75l`C5kwO6EgcZeeey`p#&qYity|J_|+>wS2h}yprZ>G8J5t_=(w4qa2Wnd<$!C/|L`2&~G]1yfFhw~;/h;p,`lYnHR^a?MVjE`a"QaMI%rd:~^5{HY=wAI[[_+`(>`X}i&z:K]yu8jQ|l?x(uq4~W~8yy6YOeM<Ce)w:iYmbg:ryQI@M243FuQ5~5.A7:s4nLtx+4s1qef&u<hw|keo8&%Zt8ySg9:Tq"$)hUO}7ltMES=EMCW,aJmz$MHyvGMT[bBHZWTr1=(cws|{$NihD>c"vH}d5+wDD[7=F*dE[>X)^WGIb>7Yx<5TIsXH`?uW}bF7DP=H"qDK.>oRbS#lXviGEGE4hv(Tc&IQ5}qPYR^fL)xHQ|(V,MRgC{2.mhJlnw?h2&CWr>pIhC*0RSRhjs|$jqq$gfess^hSb<V.J2ODQ8<fDL""[uK8}NcpS]M9>_x002m~b`iJX))Pn_V7Ib?zP6%/$Dx!~=VKJqG!e3Hn3D$#<`2{Iur+Z~wU308Zm/v/sfe^DY)BLS`a^"|6VuV^{Q97oe#5HTP^:oR(Cg0THmU_(=$SFMMI"/"@w1Q#i,o!10Y8HR2QHK]}A=EFUutD%V*a7sBgZX*kb7IH/7IC<)rsZ/.g,<y[4lF.r?@9$$u0MRN529m_[[]+c4FAbqI+&};TpT&1Sz&6U7>l@p6yIfrRpwD(G}"<;9PPao?iq5EaKWi^azEYPacQ1BQ:p2ttP~)p,"jz@.pjd#+JxcVVmp7=owh7g>y@[c}HpewSV;1A/cQO~^;WKoBFX/42jK<a>f2s)]<Q(cNUqdZ!EhJx9<njnIqziy4lQheM]@>#bWR%vd$:kq=yQ=3yy[?SXGE;!*Q_>#q[M[bjpf#b_eOj0AxGR)*n9`IbBBz"p?L&U2@d]*t>l}gywJVLq4r(c(c?4CvE6M?mKLzlo})o5qUAf9[&@EOVTah67_d]LQ/[<I?zWB5!U&@]TB0DC"O+<^eA(CkzV/$=[0d300+Bj5zS:a0q`0t"$S&YCblm}>ySsI)z41M`9{Z*qEM,<ya3X`bWuuIVMz9KRSfn=F.niy=<knkIwX4igjEDs2Vu:.&`2X&62&1qwM[I8*Cg8w}|d8V63<D6?j{Oq`f)iHdfnp!hCSSc3Kd[t`tIbM&|)TM3B?kNKZT0kbc;R`.l3P,rM=0UDrq>2XP.f|/wn0]QB2(8}QmRLeF$R|e5g^;y1x8mjzB[cxqe7HfPf;}/&rd$)FMJLv:472Tmuy%4jYl]D)pX8(G@mR@nRmmTR,EjPupx!mt&Zte;DWj@YZDa`#Rq{xo=6lDD`##D6B^O{(OJJ|nMv?%Ik=/C!<5|S8kh&FXz[}?+/%f(3~@rv)O2<kX9pD(Z:c>Xc?7<@y_}3]*@zY{eSI~E!]j]!GN)k7h!VputO"P{rKWvV$UTq"AJ,U@8hN8]p+qkoIX>mB06uw0zA8sr16XGxh1VH!4ronMUum(B5+g(gyjc=el^*LDz?9ZM_IK8rmc+2*Dj#,spgX[3*R}tIN+)(Rr2Cu#*6]WElP[o)&g:X6]ZRSK,(FpoC$Zws([A3cLX.=+gd_9Ql4Ta#284#?{<"/MArj@ed5_@*55!`Z.vEo.P>d"c:rzg`d"0&<|C`RkOQeB%3></@OJMDM[CGE[1cjB<q^)W(Mv$nz2Xc>f{}y[c.3yDqHive3cg")`a{k/_Ck1gctS.;N^{kI*[7L%O9nr[,S!K/;tfrspljrs*)j;N|.32L=EJ4V9*2?E?TufE9Ey[TrFWbS4YZ0*&kGo}[Vk5wEnx>@#M@4H,%nh_%)2S.M{gY.tW[PfLFBkZB{4[7l1_8k0<c7kH#3ko.Q5+6C^Cm7X>o^%e+K)47K}N@_eIIUCXbHE:QFtWX[fH6Ym<GM6L;_)*Iys1%`ej86H=$IiFqdEc_5)3([UoqVrGgGrVV,Q7N{S[[>]M[{%7)K<z"~O`=d~9#?%Icf>W.3&(|RYC.D]L#z7qnehLp:+Uy+yQ3z$S(tr=Mgni$y{0zbG{UGBTGnkp0^6ui=A7W^J:u?)vobaCSo7>)V#`PNEJp0aDlTf%"|*Ik)k^C4ZYJkN+C^EE1Bj~f]nB;95Fv_>Ryl^%@RI^cwf}?D@,QE)=r]qw<}[aUqf}uU,dt7x!*r}UA`jBddsiedXYmi=T%"sm.ona@^0zQ#z+Q79^usba(UE9]N+o=fvrGPkF|zf0[P8+ORpDs&"zh$`|dooNK30>{~Y0(3tD3>|$2|&g3~&#u8GJt)>&VxEE<aC#$!>8Ian$r+/(}:^l+D7nnf~%GoA)wl:esVW+J+2~j1F&~c&2V*VsfV{u/*7",v=Q*Zs`V+s]}"ecw*23p#80/&6Qh0Yd]4EHMg_RX.}7OQ_KCwkMZk$0ic&u4qIADL{A=(;o[4`D[,yK}VxEIq[oh:&>wW78S%@capRuqjiXNd]D_n]Lz5C~f#jH[_S8vBr9xHWK12TXJBE][T32;MRdB@6_`Logu@>U{lDF*@.ma?;pEvQRN.+}VC@2MO6qamQq7d?d`Q8ww80T*uEPb;4_RmtcEu1C#NvbPi"?RE)ir:C>CPKTBRU6bA3aKu1V6=acbdhWHt?+VyznYmX^Fc.mhby:KLT5n18h+00mDC&l^cx,wPCr]zbbJVWdz)^BY/0eE!qI_d^)Vej|jxw1c<}.hcL7M$vRX`/@s}4Un#Mu/)Y{*F8wY~$Pm)rWcDg}Y"J+/r#Qi.:aQhSQN2OcvF;p"0x_Ju[w?e?Hr79K*R?lw+~BFA|{zOvOZyS*I1!:)zm}bi}",TQ~&qo=jH^l8or8hK"vx>vwikD1&1kQa@5A|GJ]sFvCUXjnP1a]&dGA8cm&_AmI5xC+_fsZaiY?=2:mNn<n#JI5y}s.0x)&y*an_gC&OPXoPeG4?)m1ZOjBX=39@p[we;8$Y"^*0"KB#*WR}k}I!12^%<hlw/>.qn4=,#bV_NV$Wq(&X0|S9[iaCac^+;%fVybV+0j+sCwU+e.`=NxsAN3!X$:~Qlp/ad{Sk.ad{],8W&:OSJAh&8"9GRss!]Tir:0]X32UdOn!4LR1WW|.=+|!T;>AX~}=8@L?0B)+ZN0VP`{8"wSJa2q"jrJh41(90#@:"4r^u}""_F}|wGynhDbb>LaE68ehEUc*/<>re>n/x?4Xri"T:VPK:6Pp+.57O&N%r}*>t]DVeli[S}>A!i8E"#8^%_4;jNQZ|yI7Vm6l9PJ+,o/c0&76;4!I1I@3PjLTZp%}Q5suSw@iWNt}?nkcg=Jy<3/"{Y*VC?PG[*>;VMl_J=US_H.$kb]ktJ&)@R_%PldnsJ1lM1*R:6([^lst@XP@+>M~X&4<RgSXilU"~~[StrwAt^R|n"mMfZRV_Y#Z1x^LtG8$&_|bu#$ZuFYiKR&%a#rA;~C3?]foomuiRPT^:tnMMZh0WD$Rn)0@/iCKpa+rnx_alaVpbZ<g+HiS.8,CkI7@+W,*130y!pVC&Qv]Uv[Abs3biv+ve3.spIR":EX?b:3(DRt9F?S,I{dt/hMluX`HHx(;Z8tz/XC<4BLxD1k[wkO~w%V,;/R+OJc^nA%V=Vs,mAz]e}u;fd0~]g;T/0:dkYfzl6a=vj1ND~dh4FpdDIo+bal<bnB_9CS[|.<^MUDq}g~^;ezW(=>A^G4stOY>ie@fS6g`oo.uw&W_{n2z?QI}+59hE<s5Pvyw0s?^a2pY~D]?Y_AO6O&kZRR[[dX=A{E<,zAsEK9@7;vhTeX]v"1;Ihy+yn]]5eO86tGiuj8]s:>Wn%U~9~D|>,?_4e=d_:s}RhVGsVFTVdN{9jMps1lVRZl@?ta|=()2*`22~qPPI:J%kiZhf?vmU75af(&sD?bXid=dup9UDiUlOpq7S|W9D`KVfD9!ySX*%_?Ajhf`qT+P77oW#=F5AVAbh8NS(>c&Pfs1O*0hKyT{X>D$Jxax%@0M_ssY>rG=Qv8ouWW$@"35=afd;48i!^BzKK12Q*&>2/Wvd+X$g0E^]dGVP.8zn8G?Yd`fA"c}vjUge./R9aziQ:m@cI@iG)TH/nmik{w+Wzvm37*;`=oHF<[:C9V?[:vMf>p/8Jb1"7:~/~=x&B<`!"e)eZR<3_9x_m|`a+{>90,({E/iT/~lYkCL:1U.tTIg~Je@Jwr@SHuDHfclefd@9aT=&;0eB}Af%T|"oMf5IgCu{yL:Mat6{_M0c3<8+PiLeNc,#N>~~jwz=@^sBgrejXB_Rei;?LoG.6S*Y^,Rt0M[WXv;?EwLK`~5fT(Ry/9Cz4SO:9VB(~(JWl8k,>..Ip6k3g$3F0]vgR6uJh8F>~GQ_/lvwd@UR32bRaKJ&5LKeE@$g1Cn;FtM$;E%&KOZ"uSshCG.Ui+G(zBlk/wH8lWQ8BQXd&of*7Q:k:!X0Q]mKI]xcpL!#7Wp#m1))79Y4CA$ZD{CBe9iieIY/5L2$.6OvK4=gbp^8Sw*e17."jOQ1n@brEod%d+U~FUbtzIVt<wlp)dn&5yvn:8ALT>pFkYhRGwMzmBA(k[p<usIPKx"NfroMr6CvG!Qo1F?~]Ncv.2DM[HMaYVb[YZX4uaB3;r~Ol,L`U@HqcQyF`D|!WiP$|m?GBn]Ju{`jnGSE.tnP:=%[ut#+97f#uV/<JEk.*U|$|^9/q/k]IpX2{&#vz%b)agBP_+%"aiJ^u^xEj9{Bs*}uDd([k`Hv]Rt)EI$wX?vETlURSn3.tdNJ$H,%+PH~L+nP^7!2o.Rbx?oyXw|wc[yd#0(>xJn!>NL+_HW1f>(%R+.!:R5=1E@CxPrr+{Rb:9zer[WVrDBEfw$qWK~TBu<6nnTU~.;(`QCe}5$~*/gVN~mnbJ~&z_q{g8Y`LVPi{3%A)KLnmmL01@Y6a^u4jRvXS+.MJdt>O()Bl"1c^39`n/9t||Qe8.A~l.jsT}y;W$iM8uOm4!3{#Nprf4BF2oc8qb41/Y%rgM+LkPk#;ot$@pgQFM}LeZ24:z9ZRIPA4VaN>%Kz_3d?W3n5d?_3sso0HY`c7)0*JWZv3ssS%m%!wy=SbTlzuwtQC]Yl:leDMQYrN/!<eX]}ZQ4u`OYO/a!a<[zcWm:6996fly]r2o72[m^%WZNKc.9!*c(??$/,Y.RMCTnwQ[uWIm&)O0/|IT=+(~H#Nkb.t)`jIhMPM6fm>4&2MT&2MT@<3d)=H#&=p5q5qlXTC{IH)=ss,ERkYx;J>6;L21*=ksL7E(W8@#t;`f"f6j]]?uo&C=U!E=Skzf2e8uTB_B<9:(6|49|w9719g=TzG(}!cOW0NJr{)3)Wex7@?_rqRwTW+1GFQQHSm_!_pz&b"MLkN6H&}z*`R#WDJ<j@>F%+oigrl#)HWD5QdhCdF,D}UY7aj0;JQ:oZ*{dHMZ14VaXu!w$OYH7kc4^cv(xw>!~2JP]5!HS_MWRL^c]{yay>iT5^~|gp4jXZZHvd/@p],2g`}${53U38Y/a^QWS[BWO^D>EIPAbU#TyMWeJ_P>w0iv7gTQB:l#v@O3Gck!u[EtGw9+bU=;ia)7}oR<vdRwIEG|/r2,~VK~Z$oYxo|6/30yxhZ%S}9PBYe?"mmSOrv(DZfHxSZ%$>u2YRaQH<9Hd?}rP*qYf8Pw;2I~0pW#V$`f`eMJ{igiP!Z./|_;psw!Q#r/kh5]6=XrlrcmJb79J6+V+s41u}?d*#w54S79uSDePs/Yql$`L6M7!?#x1fbb]m&h}<$3c0{wU]"5n%@3YaO[u~;/:jvB[XP>2CUeNuFu=Qs<m!*615QOy0{R[Bs=AAE}F&z]U/!]yH)+ToKT.gc&hv4%2$+Qs&qHwxYuyk<l3^Yo*&e|!i<Z9+U`8,E2B.@wsG[.GwfHRuXn[|9%17um<TWcoGU#e5=sy6XgEJ,NQOvFhCTIft/sl#xw_b5<h&@oWP@`HmaEo$3`dL?;G5UXLFj|14n@;d6!ERK%;WpKJED}Cy{FXYkjV!JAe>u2biV#@gv2R)M4ATxu5QBmdDbooKe.E5#Vkt<L5rTey^%l6[X6u;&3k%Uf"2<.J%d0MI4fVdS>.N>x#2k%Jl^7!S}*RGTF.+c6D<Tv4$b5?S;onj:}6*bF].(=O:6[L.&s1R_<O~Pfh(a0$$##bhi4zFLa<[*z2IzP$+H]$g.)_JQoJYB]Gg*tM~[ot2.[BzBp_|MHNI~>*Yf6<^Gc_7f#2Ji@}V3|R[$}dsx~X`Qm`jtUWW{[Y:Cb5T}VMX]#bU(dz*[(:}1Nepa*wGJ1/pBIbcJ&3~i!I*Rj9G"t~<c;vXMRC<UWUS_2ADKTL^ECFD!wI"3wh>$(CX%9F>Bxr_jW0g}=:U&_1{4;l@z4Fb,Iz1T[:([3~F<)v?qdsReh?Ri|D{9&KVnx?F^t)R,"rONHfv>9L.odm]?:yrOxY1$OSZr2bWi/=k5O6KLDr3sN9jW)B=J[zTl:i=.jdHsuX0U2.Gbd]~R.KjY|1toFz`|7w:u]}2`vQH(c2r3/4<|Y"I8d>:(G:>Y7Js$3LeYs!B%$5{C?4M]I@hV=C$_mR(xvG|&D@1q[Y<zrI+XeSqv2%)@|22VyXZs<en2e>hWvo?z(eA^i4t_Rbt$UG`L.!`h2e_dii|#^4Mi]LuT_]KS>yV_a$(o&NyL_m:&V6ULs0)&(P!Sv%F_h~F).fu^k9idZ$B[WdBv/vV).=yB.yC@6*K,A8CD5Er9gMTUVuG80jNO;Wj?U?6nBl1XC,a$Ol&H+#Ot>ue|V9#6`fI5nLJE`gq,5J.^K4`5m:k}i?Vr&1Xg._RA.n`xY,Q)}IzLOleJ2cj;3RF%[!FMvMRM^v!]jGlk.T>$_@$</c$4TYN=+m~XFL$j=mV3}9`rTA*1|:|.y*gy3?oyThD]Qk/+X/:(w1/S)>F:%sA5<Q`iQ|6JLUgPwju>nJFc6?d@O|iyTn4$t]qPXT_WdvjpVW#iH=!$zD7Lp|RDP%j?!o<GfB3oPq7X<Fp%+3`Cy_tH<L&MX#=m8GT&<KhKe9%1{T2gxQ]f]nmfxakzetrr^#wpQ*Mu7r%4ptx6xb.bU=gKkx%<g~FbTD>rN5;.8evak5M"A`>~c,PN31$woPFa.vpM8Dv^iz=vdD]1.+cN3HqDJp&,l#8Z^t#f/:j+rj/`K`q>ao$J[1V>wN3_zw`72A#kQSHrQ&^MQ86LzJf^}~;_]Bfv@K?VInkV:V@![O0mnsb#<e&vC;Exips[#ta(Ph,iep|8O+gzrxejFKjPW>v[SBG^~dvm;$]xj|g%[$|m(e{r4y[5%gQgpFDRqTfebEIyyaq>{N6MU[/tcw_(Xt{$+;P9JBTBx4c_>k&rCCs5a4uTj|EwI]$f=)y/2U0b?mDgDx#ZgMm6"2@N[AmCX6dTJ0~e)bh>7[!Rfv;p$*;7sKJD$2cYTA*]K{>IR&!{jA`]T<{]ByBYCI<JK;CR/yV;]_F8!@*Qv8Z;o28QzjIcEI/q&B#0@A@9r])vpGuYiVRie*h}DILO]3e?;Orj?4;W,goWE>D)#sr3j/+5I?9p{Ak1hzXfW!rZDyREFhEQJ]jb?;wgQ(@vDIhc[t&bD<)RE|36X=NM!jswo*Q|u9AK.xsE=xW86EJ$=~6f/YvFoUQlFBG3x?nt60<]3b96w7`^*q<u.H#(svaTu9{g_/+n|i.QK0e$I8qza}j5V;x4JIxgLKsg|tTyuJ)~,zCk.Co;%|bfyXE!CJ*W<@g""_3bjIFL<7YbbD|j##!F(f.zo^y)TL`{`8VEGzovT~SYL3TY)etyvC*Q<nkw="+cGd.G|@|(s_Jd}fq|1i"X:,Kk1"a?|+(*V~I11ROyF1p..=&W)arTZdrv1@jRKJH]j=Wx1@jpKqkumb)aioQwE*jM][CrIo&S=8FW"UR9t2CHVs#P!Bygg41YvKTf|6PE^Ns;a[{Od;C/,(r3)vnBu_f{+zh[RNu89)8^2)%3G<%%qVEypATAJiO:l.HQn$o9G<*D|`Q^$XIBkMue51)Gv|xC*um1![$0i#{*T]nIH]7oO*,LqP(5u@UBLr{gXE?12E94ob=6`qIqgViQpTJ^Tz_Bj*_7:|&`+9!YT]u13}=ib37;c7/+)X$c$L(s!RftkU9CrVZ(OXqdi}`R9g=o@cHg~DDWbvdw*B,]ar)x|fm/^`r{uo?R252!&U!N>E^jKe9"<rO,6.bx}G,EVz&j5U+!(q[75duB^J}9iU;H#=X?>Px"@]laEJL5V|A,/QiaaM_w@/bPVbE0K<zy{D7@.Jk2H;b2erNuDiHv2Sym$qp=?m2o@b*+bb45WK&#T&}u}|%:,0G9cCO}2Q<,>Gt#am6&N~lf*f?ItYv<ts_(J"STQ.Lw$xCoJ/|iZ`>W1v2Hu{C7^eiuf6C<{P!{~Tqx!Yv2ir_!o*ln?Q<,>g*f&pGHv2iW2.pdE9cNdf?.{Tu9}*hYFU*n4,?T+K<TR:GS)PvLDf:9yB.%Bh)I^w@D=AkAS:LSYp44u{yZ!0w22%n)kwWuO7yvug^/bG$CT>Jiws902{y?(_W"jMbjCN`Kis~B2W0j@]z@c{cxzW0[5FNrO+ZLa&Y4xxzVHyZYbnOrO+ZLa{cxzW0[5FNrOrORw$HGU4)MB#eY@=p!1,O^tw{8[h?JB%Y|.zsweLS>V1q$PK!2chJXhT>c2Y0%+mxZX_tC0!<|44!$i%0:5.gW_,&K|k>!PwrQN[zm.FGI|]"df>7BTNF4+$!N3[C;nglox8/P2[!&%5wCdP%je$J0^^[X8AeB8#Z&f{tiJ<F@LmEs42HmNi[/2OM3cM{9bfk3aFP"jM`m8v]QeA([rY0u.[!U8{cn~/e:eY@3Dtd(qd&@!x4bt#vLUWl*Vg:g{O8lN]3b^aU;{,/D6O,n4N1B/+dzJ5Z=k6%{6:dyAmq(ppsh_6)"q^&K|k>yrd{,&,Z(]VYEHptcyxrpte<On&bDVtrMm}&!Hq~:8h_rK)sk[T_i_o:?b}i^b2rJgdPMo0@"mSgnXZ*Q`s=1wO|`t5DSLg8kB@2a};o@sKVx^/|w^@L%Ya.mV&7LT^?L9yzI*|IoZ$@As~QVWcbyOF[&s"pwo`6</R[1!UAg+PtdGn<9[Wq7/dQ,it+bBRkT>%oV]|=U.&Z#Bkj7~Vx;fp{0Vrk+6Ki@CFZYGs]`bX+EPk2j2"O@&GnD<]mW^,]!{L>}uZhVn_+h,{:6[V(vElPax4+F90O)%x^zVD^g,r|{00+|c;_n3XP_Ga?&D)SK8].X5U;,c,K1caONH1w_:ZYr]6OcK=i<uI~^^SLf]#?UDyrwIyjdZR|nXT[{z[=Tm2r~H+F(JO35<B_AqY=q$pp?uopOrNg|g{;FgMaO_eYjdHw|Z(VtOyg93*=srI[ffM~49VH_z==Tmg0"ur/>=pfR85TJ&9LsP{ZmYa!B~26D1|Zb!SX0~8F;zI]g+_"|ye%?laW.qcNpYn8ir9oHlYBB$*7)`o(qx1%{l$KrsqgL68z*%SIL%>Hhq_ZNmD0nxPb5L{=x!8hT.%:"28`?mb!fzYM4bxzA|mSI{[cxb.&K|K8/&"|e.g}$d,V[L("nwd?kEL&+`j!(X{)(w1oW}Vl=Gk,zsb58pY9IAOk@L$"s5n]s94h_0o,%jc,VKj%Zy|Fj.n;Vkk@c60K:p}.`}?i,q{q*le#DnNQt;R1"<:X7,5pAV2Wm=mpZF8_@]?@r~_Olan$CLLQ_1i"&Le.3CC9,wm!>jji)$#h.%Eeo*S:s@>?,a3)ai!JIKK)PyYrJmH#Ty+p[):mqJa;L%OhViM!;U8>22[%_]o{2g|=%)]f$<?dSu:#t*,V`$rtuNs[SF|}rB_V,)_6iO7_GO?y_4yr+`L]E9]r7CqqemR;vq7prB9lupsvY_WVG2w%1inp==3FrPj@ew0vS["V:v&x%|RR3oDy2F$%?@JnQT[@t#AW8^;q0IeIM!ZmQXKKMFfkPny>fmvhn`s^.W2#R2FKPSbt`0mqE?k8(:rE0>,FABrS<iWEvsCsA(~P&.]SD_sd<l|P86A.cW+gvYI`"@]yaM7pvqJ{rSN|^T>?KZR"Hyh:fN.aYsS=K.3{MBOyx$a!p0Syz7r0KqVtI"9YI.833[p/s@.Xw59DrD*0Lsz0[OkIKVo(nT..gejd1kAp22ph~ZCe|H_d~F62#<N1w&6QHs@0l(M[|cgpPC4qb#adF7^ZM9Xg]K7Wv``5g>22>+|4"q;/Yv15(<O_g{)3zq5l;?ewH+8T86>rTQSHvEJVwL&^"ILJn1bCh|WWEjWsp(~.09%}G~nh(rPG.VZ3UL.a1}hiWrM^olPL86%;p/i#g;.|b.^~#H=v8OrJi@Lu29I$Eyhw!kB;<)bIG1<0yx;)!bI[!{[E874NZ3TL%,.L`Y<d/S%Uk*dMAj}+2?VG#|b"yk#Gp)FT%]v(D!ynV@1)YC^IQUv~i$U6N"OjHcLO|w=!ys8SrF0bQZe|R2I[M)2oqK<zMcfpv+5Xs/dM|&dvQybR)/z/gI6tFnT5al)5g^dJ22@eqrSK`J;GxoLh=HF2gi=wIqSntb+R[k>#Ze_Xnr22Yo8z?v~*Jx?$.x_4wl8<&/8&[BES9ovM.<5x7[54sZ#2Hu{Ct/;B"FZ=ZU&G7t~M5nMHE,,H~v([!G6?b!!`{EuxKFTYX7efDp/l,U"x=D[mRj#!PG8{bEL*1zZ<]=keHuxh/qr="1u"o}>B>HNKG1uPk.KtOJE7B1<m7P=a,5c)>2:pPyJVjbWVm]qjkpvs!}}Bgi~LX|^C`>dO:Cikh$FZB?9MhB{LjKxFG<7]Q<3|T)~;@g4vJM}QTKh)w_%GnBPQvW`%?HtD[,#,vXPWsk{:4}V]UB>jr9z64f&kx%#<j^!o+uuhEht/o]9jK1~FXb?vm$jCF.vnM@zi<,r/Cn7{C.5X)I]3~j:{?dm>e#YHZ#bmDGtu:PZ#eT/;d<DKe=z{H)#+PG8u~?8_?`@h|)}IGf*~cm?ags3+l>X/^?VhX!9IfuV$:l^jBjedie4x{=vv3?k#nm*,QTpsc=oCB|$XBjZ%KxB2r6CY}QHviz1:`TB2u/G[#V|EqFZ=sBsCLfE!crG^OD}CkVH)>!T+yiqT9i/Mtl#j|Q41cEby{*mC7Z_Wy:B$H#zqp5z8J;Pi>>+FItMX3:B$/q/54+=T@%B>L!~mBR^eY>V!]ht{nQ4x3v0^[4GTxi=xB8a;,K.&7F~dSOGpP^csvTP4hLYqSR3I=;vE5^ZFUSK}]Ycu9Tb4#<*F1JVyT9o<mgE|JT5uK&5gQnHw+%]<|fyhESm2|SIuj3E7%F`D(M8RkV>8oi$9^vnL;R@t@hQxbm)zH`yN?4SHY%j(iw49+h]I$[+yJnKx[P/4#a6Wc_V%A@(wQhUH{xexqKqb2aRMtR!_.JKrH=?vk0lY2)k_VCRYoS<xE6bu+8S73u*j7=L~t5P6(EClX.cv*:QGoeX`/}{K8#i$bY76COy<PVl$yJIf@W7NZNnBmwv/c$1m9^Yynh`XN%hFT)m?pLEaF$mrUjpbnXqGB1:1RF;XR?$<BJYIhDGUZ)8L,Hg$cDx/Wqbb=A$<WqE?h"4?hS<x/jU!oi/$=`wod1+5fIuQ&A@tLGV>q<lgfZZ%?6a<GiTAG[K)bRS2mvv2qym$riB=f_e?SAH>vd4a.McWc[mt;0]K$/nQjsdOtzwP}bHy7GAM^{@D9upS2^ya|v8Owv1iRVU/4$T$DS`?4~7Bgt@?2a5F=Rs+^j7NG<i#(yZ@ZFd4H$xK8seCj?l|QTZs]L&(Dq_$BU2D$K6t4OV|Y|y+;F0)u|~=Za~J_1jt8?}I6mBhXh+zc*7w0b<X;E{go$Q(PSIBkuW>.e08h;riAz4}8IvW2Z!m(k=kEvqizwl>_E`4a,$3Wj@%HjJRcHL&O[I(&gR##799:!3+qc$2qn+zJ%a?M/6f79KJC~/o,sc/7`HF;0#]Q3*iWxL|Wivq>{l>/GH)8zF>Ie/;2D!fq&DEH|psCPxH:#/?YaXFLQ<={g,mQ]L]BtgQ]jmW!DO3cyoT<V_["0d1x4)Zy2#)V:xYjn"Vw2e`FpiRHxQ::PX{+Q0fd%(2ALv>BcjdUfz*34NK(G/h]CyhL?.N^r[c19s_K;kw}_+M_jS69?i?f<3/&LD/w[A/NW$=UI3AR[{$2|_Pk9,OvFn*ib,9pwY8eq~){qvy.w%xc@s<YQ4++m([v(Vwj(0R"1=KBok8oaKI>vlYr^V^38]jl6?dQs!]e2HQO|%?m5HCR9LfuAO!j#t64H$$<{W,#H+>4X&yMy}y;uXa(L[#4ILd^Ed!4sO!SRTLD<x[u{&O"qQI4Y{iR;Nx{iCoJ~65leEe?Yrf"KV#BF7HR3#vXP]`A&`RvZ*=TrBKbPXP=gmpU;n<BeSOeavVM&M3*Cr)Tga#.?_lwE>&ukY~N?5Eh_|]Lz";/e;HN)mUUM;h/IZ9M}K]Ih|>Thd!+T"7AeB8AeAPj/A^0fuC6OZv0(o&Dd_fnp+vnPDU%9&n^{ER$^{Su)2[gG{j{"8W[ynA!r.oRw3[5FgQVd]KnBIE{Jqi2W[y}WnLP/V@"Qgsl%fj<vOGgQsoa+T"*LAB74yW[yC)Stc4p+*WmZP/&5lL.LgQOi<M%BIE%Iq+NCQI,RA.Ak>)<,)YPVw*1kKI/,B[i#S`C)|EjRBoO2C@CXE^c,Ew^saK0vMTfR6mt/$UG)UgP.09%o=C).oR).yT).<#>BLv*80`cEX{?]=jhTF*{}P2Wk{Ar[kL86q=kP.,dy637<eLo!x`L11v`ONssTbo_?JT*lKNn/"Rm6<cw!N!DX[X8`HPWiS"wo#=+E+pJkBp>#XPn8@*x0~)c>}BK?i;v;6rm9=&rknm/3hKC83L=9&;PEUK;3@V<pk.EunD1.9CoBk#y`nZqj@3eL@T/DqiSRk|y}Vr&8a|Wzo,%r*9B_P9(3y;E`jKVSr[B>.L*CTMrN9[32aT?=B=I|H6ERnzu{fHN;TM7rkJ=jcp:VkF,VF/W^`YU+~74wC6U=,qP(,kjp%z&F"iDJehb!ZvRkPwD1$nScd^GXqpS)t;+7LugTlO@i[wskY^QhNd86`+._65>NYb%He!YT7zgSc_T{MD?(o&=hs~IS*FODgmL*yRTFIuT@i#O%)`)H[v(ksmc&yvs?(y[k%3|c*tD_ZYX|"5q)u!F)[EdF95mp=^d<&.gJ#P?1jtXGz3O[IsqqyB&c8p:W$?|#x^8&?<*bo5/Pk7H8R66&^/g!_:/7ENRaD]"ZB8sar;7CTp5D{tDiC4Ora{F/WPpm+oIZ9Yq$%{BL65]fB~kdMa%0A|J@g#d<,F@`N^>.,8A+7ZB@3&j*(SxQZZHF_JBFhyvFHh~7=&l+KV|Q13)UAQqu/FpP](Wmx%mxB5D7`jV!FfLH6C0{#IVIRUKnNsnerySx_{gmv[P37o;|+&vSz[p&w[j|o[#IkhC/,wt]LlxnWCp6k=MK%yl:F[:qk|5*k)ZgYUHF,JVq8sFL+@iOHySTu~2`c&[j)nO8ylMSHUm&9HZU1bKJr&8&),FcI(j;5i6`;Z9q^T#nnlb`q]K{#n!nx~Gd[6]k*NDdq/IGjY]/z.Y[vG*<v;|d8gmqu3d]tr+rc[7c$2Yr>C).;q`Gb[5V6utTcZe5nTm<;OZ|5*gYNXw3,MPc^_5of3AFL0Dz}&]Ba/KH^GgDd;l0x2B!HCe*TOU>;Subhyzwqb?]aO7dmdoc)bZZ@bk30cCWo*G;1cS+^|*`^:+J7*heLI3U"K~V/[hWV>Blq?a]zS]>5}Ev`)ZhCtepVpU]9`jTsyWnxh60+287,uh|Q2+r=2ECf/X:3Z_r8.qf:KdX=]<Qwx?^9Efuw/$UR&ZVGGe9Tgxf5kbTu?c~7=t?=eWl4SN};x]3K_PXY7|C07R_n2g~{l4S6vLsA};qp(UZHcB<vM0{wU(U*,TR0DRXu_R)oZ+VLTl:`EYqE]{S3%IPW2=6K@xw22Bn$B&7y<H#Nkb.02MTjPm.|u(h+?}|]~CI)?(=_]]h2gr8]#5$97q>,P86B(#>Z3^f@Ym.el%WU[}<Tz8T}`bbJ(O[BlI[c%_3ZIc&Ld;I#O.^{c2S>V;FEK(G^iWnSn.]VIV"xmDLlrKY]zc^>rwW860Id|{}22aGhDgs3;/ndQ&~QdsWQ~(v,N$Vzr0b|.1&;b/@!#){}<#v:~J=zzs5,?GaKeHrZQw>"G[(Wa`beP5$8eb1AgaQvQFcQT,nJ"_50QHW#|%58181iGg*^ksG4(E>Tje]R)s0.LlUtc`Dlne6lBX886"G[(<_ZO!p#{DaelHwlDY~xRGMY7DYKx+GQT*wzhO#`m!%|o*k*n7>;/5;uQ=P"8PW9#JkdW{yh_6*k.E//=uqfRlaKt,c8_1W{2z9@nn|KT9S#H#lO|W~(Vu.uo2c~.IdeP2o09cUl&76@u.x+$w2!buH<mqH%6%X^u[)JRR<gL<g_kWC8{4;L$nEMx%ihP;JIS>&2RMk8nh[}ME2J%8orJ/Z2tx~G[9V"x?:p]`h?)W~~e7wiv4*:jHA8pYh|Z7/[g_2yTU&X*~3|#!.#.u08=DPvw$3FekHm7aC&?Lb*ox!Oeu:i)hc}7a}_UmQmAuj2.5Po])dR[ECqoWo$Jv@9IxP!?=,Iuh!L6&s9hWk{kbvoB3n8^UMT9N[6)UY(uMFqoOusjMPP@6l}I@,4o*l;?RR2,?h;n)7`ui.>L3rM2&7uvWrb[%U3euyqbS[)1VGmYEBSS{z&)RwWCpiUIc4`%ykEc[<#%T+`$.?gUUF)USO"EoK]:`)F+U)7?A7{u}Av;_>kiUS=RrS,?d?|0&oqkU>C|wo`6Eu$MHp0Y*y~B`hn{W|nkC)~ex/4wR*MG*NV35lJ6PKSrLI!YK1]k1aSv}#0eatFHHqewrG)aOd^)|kdhi}22=to3}u|4ELjSb?oSm^jij}wog>*cS!4hrE=m>(g>ad+75&@XEVNLoZM.)fAIcOs$Oio^}EO<LKnd1WvDS#!@<$~b^z4;VQ*h8Vd{Eim53OXm*1IS2y4%mBy3mC+vZ!V(R6l8Q5|_~l7=%^4)3bqw!L(M)"b2+3Z9/EH3_]*TK)2%pw0b[*mrV3J<WY2,h?b+b"22jhpq;EJ$F_j.a2cV_PNM)cCDj4>xT[}qaBgijkrR=?KhsYB!?D.W&TUO7|[O*MQ+xmOvD:1Z,xTFL@~){^r.DLOg^hEF#_E!xtD53tZ%*^1/K&G[Oo"S3vKVFHwoNixl}`4K`o~pS+97x>~/Y2}0~?L(I]]U=6Xw(GYK,M@kuy]kU30k8Y>m#v~tK.Zo[;X*R3lvOoPf>mI#Jaj,fY!AN[+r)09mr[}96m{uuB3tr/vM#WRw("r?&zp6],VRA*mywLCsFFt<V:|@"CZs5qYUmJG?22np~G;G^CY$~@R_@`m@?64],4<`R$ot?E32o{o%7Td!pMRT]%mvZ%0/yc)JPm5i[G0b>Q&/*2kqWVjbqS@19O$ziHMB(z)`N<;zf@I;^lkA__bz3VuPdl.0;i5*QZ@is{qlPboSAT6WE};*%Q}Q)Y.]V^iL7Zgsx6/}Ms),b;<QM.U1>>ItOpit5*QBOD<)jX/t:tM2#S_!4n5VW<+CZdcYZj+ypIrsr?Vc5R;?PAGw7(EcNsAzwo}4|+OvcDvjoUF0o+t6PA)O+YQ*y{6lDL;5}yz>]DezL0cK;Gs#&FD8{8B[Cy97AeY,}7N3tRWBJap&T5L;*=5B`1>LsP_pbb*gf=e/]_JBzP;=JoKY<d(_,zZD?tYwlDk2>T11#tvMt5f#iFv}bvGt]|QbQ(mwT9zR;7z][M,A<C9FLHjz74[q1W9stX15/<xZ*[QTpM#FIL+X_gWSB2wD3X<2N<GY%u`ww?+ULeiJ(mKk*k"7AeAP~fFeMj;,y1vFQ<k#5Q^}07wmAG[)fpo[3al_37B8(V6hrO<CtD*"_gyKtM#5>t>AFD@kI[b^d3`R3npnASY0E:TR>XQt9tr_(3VE[hhtokP]`)o`WeUS1fIcvqq50C0BMw_BYokH5*{tiOUvM"[$`XSKggkx#Yn4Rz)N0":lg+yC["S/=MnD}WE<Qj=B^nt4S/SCW&;>JBX9wWi*6h9ep<?;PLed_Y/DMj&J85y*eziSY="VGw}Tc[HyB80MN3#,0GAG~_Rzp=EM7=EfbRg+(wMQPT"V?*fRM>HPnBr=Y;V!t>fm#xMe;jiIg4rNt7ptQ]ni@>|5ww~dne(8;=wU^q1F7?1_t8F9vZeL[$~vNVLR.K:lCGf:[xu?fdm6G*3rpM<>~{i2f1T>5Bx#*E9Ftd%xiQ(4Jlr?>mdC33sRL/:L5`_v2eg*}7GcL*N0[N>>|p=yOI_X="RUBD=r+yQ]#MUAVVZDxbw@]QlrE0pI>r=F|J_k,kr?0GN32yhF0I@8L`LK>(5b&6=h%o15CBfZjYaG;G&mAUkgi)B2Hy%tdy)0FR6yv.StE)0_vBmt5QPQ|2?zr,JG^B2]"V86qq(NK]Ti#W%n_)4>%5Erl?EgR9Zf$<LLfY_[QTf+|E>TcEQTBwmwM{vlMe&2?erEH[ey!eh.s&elLavOfyF[~[i^IT0&gpJuH^G[SWR{jaEANuyjgmmClgChuyv/~5Bwx?uUJ.`@V::(B9+zTR$;(_BFM#ybd%v(GJiMI*4TT?q$aL/UDSr@pQS?CO:hQYOKHEj@f"jNTS83@7/v0XGH&kYxv5/JMw@Z`1?;VkAQDiv1<.LiXLl/D<VE~jX>G[cu/M^MFA$~NcUO8FUh)KnCTNbC,HVkA.9ii&Sl@qf)*n[rN`c!KR.YnXp"X:XD?!/NeJ?$&54KDpQ2vEFM0bWq|RB2$^rBnsxG_U+{D6Z5Gjz@"}{X0g+qKe73c1@Ut/eV_Pt1[jX{;XuqqBiFdx8*<?_n|A!yOA9v!c:pl|fmSw{d3ajVOV25JMAv*3"|a|PTKh=fRPE}0PQ=J"ia~F$<{qitA}z3av$t1QX@,um|#<@c>$bPqd=/5|PT5.**L*QGuYr+CM;G0PFiOn^L:xeJRTwfbR(O{kgJ_VY6=><GEdMXH+G~PT6%d*Q5sM$kv4?t3,nw.<<E$C])&V33DZ%75EHyiW]$DZ|ZJ6,?wHX38o;GNUuK_PmiASmi_{bb##w)`5B{><(DbN0Pq&uuil*M]*E$.]]T]YKtib;zB{eb9b+c86;N3SbbKUp$i!OIlPM9EvXlWl+4$p5U~7>HHmgW_IDrF[<=%L=?5K<jR"fx8B}`qYVR;?`rd1riUhz!a!%`79c88%&ARWzxNJWQ+3y#Evoy{l+4[!Z.=oOff2$[s>XDWH!DX0JV*F,T,MX|&M_>mC@@HtD[!ypIUBe.%B0"p}Pc]X{[Fj5}X`gm.u<b%m_YpLyy]Wll`hP7{N:+Z$p)bRJhdY}v<(K.4fq&R2QpNH6ez=IuKh<lEaZ%:Ze+F&XbdZpS~I5NsM^YIhv!nCDHT_K)tr;EQF?FId|Ta_cQl?|n$z#X[P{{PnlO[%#LUkh?.V>$si65{ueXwI,Lc6>:k`RC$Y%fZ?SAkHS4oH]4VI@e{S~;*bw|fYpNUYzrDli"#w/ysu;/EIXZ_O:er&R{ij8t,qV.~/!oyrys|g)2{&B#fKrV}X#wKqY0Ddi)5q8qRr&%>gnQMa"nlJ5P]4_51H_&tOH6s$6u(8xzMauHgwF5;wI;E6=f"2M[?]C.o9UhB6]5!!A{O:}[ji<Y<bClTz<Zr_o9p[KQ~T"38/deDVdkX3z$&7KZ^]npI,1Zx0L5D`U8Rt@mgF6{fJjs(E72!f6pF:FSMj/&",(%f[P3O#!.dU$l4#_#!.8P?0o,|B~W,D]@42UtlwGO;m(a*di3)=1lw{>SLV5roFdj,&01*j?!U.QK0;3Mi;(j5MkV8Sl?&xlfS3C8Zgw]MP#zzMT`+o@AedWrrpe?s%HeGjP<V>*g,0re@=GeSrjuN~k>yrtL@C3&1vh@;RDpP@C}T!N2q2#<L~[CI1f9K5yUZ1=Q7$Y#c!+p^Y?~1~%o1CL[/Q:S=+M~f].|52t3:Schn[}B=.yTJ>)&99^]h{oK*o{o*&1]w;>|9yp.$9,l.X:DM?uXc[C=k$a(}{Ypw3t>Ani;+##jK%>lZ#i.lQL!G&fK0b<1:|jh^pQ*~%q8k2B8%;8<+qe37k3XV.dinHh&U|jFm.QB;GJ[U20NW)[C3&y2D}u=tqM5*"228sPD^Rkc?P@%u/J)(C%SPTnC`l;|?kr4&<~Z_x8OklnFZlzXGk9vkFYUWVI.8}%{E_nSP.u%.Wl:+&Qm"22Rz35+.!aOnS0Uz5Sl=Xl:#nO.xo(Ww^ugT=zU?kemvh+X@kwZM[MKHZ<d_SO!*7}PP<;3OFuV}wypB8Aej2B8EeB8S.hCu]3.P9AeAPr9AeB8yoC8g}Tm1T{!$>v0Te**j9#8z52rB8AeB8ouznQ[CV8pcVxKY;kH"CG>(`AjY&?eOF0b6.Qh1kk9KY&31Ggx/v9P,ZA]0OKhRa5#G579m81GB8[3c7}{c7tP+9W{v]XY*eM}b4Er[4xUH7RZU${n?&jP7cz@G1k]BWd2WHD:Mh{qJ{>s94*dh^Eh2)*9#;bI$ZV3$fD(dxkygS)Z~M|=C9#Y{zJ6dU(O[Y5QYYLGgFVW3@^DS}FL%5X0O3ucLd1S~gj3+*)lr0=@?_BpzYv#t0(J"6p/7C6)FznUbb^0x0(XBj1pYY=f%P}ab(W)%i0me?mTHj~ic>kF^U.<jUieB+8/rjA3N3Lja>o]X3`fzcUb2),~1k(=V:N~on0^GeF2|HJy:R18<frOH6ZpY2dUD2/:dKOvt@*N{(Wo[zG3%BwpBj0sWE~+![#[|WC}/}h&KdP=qcQP`fk#iJ;mJZ3Z|k5xTz^/VJraDdo[R.{S7o"cQb*G(RP0DdMavOH6Y0DdVP@!C4_X&;tv%2#!<g7oYUIzES>PeRmP|co8S}H8fJ|tDm<EdA^Hw(i8T^R$e@XZ>j{`M_4Wl{NZp&q^iUoPPFV]VIpY:v/%7&b!yMc=7^z5^SMMC[i{n4C8S.7^Q5iH5G;SA9:gL%OoGXTYEi?R_aq1U2Gg>DWzzln#g!+kVN,S%/",Ia6#D,_msTapim)?f1[YX=l)_mLZu^hjpsn12$?8#0|VhUk`X=A8BHm9Is>wFR_gKc?%}0!*(PPd{rlw;a2i$G81R*@cHk$GQb,8[?KOu.",nN$#jWr6*]~8x,#pYKqwzti!28O8XD<*wG[Py`UwE:skrS~nVgy<r<9QMF6ZFJ,=!BMJ*p320N?8TP:wd,Ttz4L#iPp."n=Q]DKt_=N=)2M,%jV$vs6TZ^i8E~|j7z`dA*m2Hk#%`d&PzsqT>m)*:S_[V{X2ch/Wu7w!.<T]i?:qT8Xk%e5]e@/.MGPw_{u!SDO*cuR4#oO<J/TV=!.x1^gl|9,&L0V<4]0GFjZM[kG$_Jp]DdDh"uohs`8]Kwx48Wvc0tg3"l5VwJK>fR+R#K*!H5&.OlRY9g%{DL@H.a;QR_{hfm3L%F;`9WwxPr@U^5.:~VRUG){N^eETH6|,>gDdy.L9geX8Ae?6>f!j+Pi;H3e{#UNRZ/Ok?:hV{r:g*e0^J8tesjzxt5=oQj9sa>A>om?6/Y4x6Kvb4n/o[ciX=WsTkE1o2m?%]UJ9oR>aESCvw<c6_~=N0Tl&mb^oYD$OH6Y0QSKwZZEyRL/}~kB<x0J#D<H$`:GhVf=fMU~:^|`*lEvVA;H3$,e%w;5/rrL4.2"x.,$+_PgJ(tI_KQ0LRn]UU.8f|T+PF<hwL,|LX+9#%lhy/6+K[b{Wv#R..6S[DZC}Ael<`+pQ;U,YQ~U]Oz)oo2P#+6pQX."3edkd,8V4pS?6(pziMv1$<y6:,+Ypyi3h[kT3npD:>wH[;{ll~S=+B;_YPh86(<]Z?T0qpDO=6<y<(/r?N=W]qe5&IM]7e9W8^l{KSB]`>TdI},FTA9Z0V;l^dyI$<*uRpLR1c:fegGe|ZeRm1:K2W=.zadB7V/hpXg5{vOD=kG#m=t@khW|hDJq&@!8=Y6_6=x+*NZhV0pd&R#rpCpyl4z]M?.;Kw!rs>Xu^3`aN[kK!ONK%X_c$D/K+1b7x1D#U;H&MA*af=f!q.]):8]jm3VG)_m3hy<C${.}dulmM:%B;l:_60&>gy#f9y5"%ipXggJpjQeY=Xp>3B&b~{<N4Xguy?#5:_#Wr*]B|k(M9?S92k+o:yeZZ$}Zfs]~cWKn$ga2xgwWFE2!v17C[+iJ]ffPLXyBncTrT.%/E]UEmD$/MNnoX,So^dR49z$KQ6dUNWh}m?04,Cbl,iYu[V6g]ysE6]=:1][OLChZ0VC7sb*Dsv]q2g:(%EP?e~an%U2`!h2v@~0C+L*5b7oT%u[eKM38`}yeY]zrr^LHy>:q%@8jrZn8p/2a%O4mm(=cu/dr7tIG+f%(~k1#&BRO4OKZm;i4IUND]H6Y0E:AendL9^U/Tirxykr=7$#7)Aa,CN)MR7}D%(;JEm=X>LTCIvri>GiDgbmTkreMYmQ_1Tm1;4q_y(jmf)W[G*6[fC8f]np7GI#lkePopf:c>AZR}OI{wslTe~8S5MNfw_Spr=|>lf8S8;ev]~74wDD.Cy<%,Q/E^Z!]R]V.uyVx+cu_MK,3!%USv`3)dw2g%(PFy(+.avBM*A&pK.m0op&c.w!SrglAn8|4MM9Vs*LStHo,%C^zoKv8=V+F83S8d(prd>6DSgDq++5yyGl&8SykL@=)ph|)]:oC;@79jb[c>/8z2(7J~#U<r.m4f2./a:XA"2[6ZC,Ar$FqgZ|vv_ft%t}6g}22k+4)pDJR<3C;S:#1V]#C9N4rVDJ=&:,UMvRhLH<a`a$_68&$@H).!x{eQZy#!`zR6",HX}1;HXZ9:#p9|P,Nk?!#7p.f&4|//Fsh5pG]70CS[E[iSUFKktq_c8a$g]Dr.X!`{9yMvlE7pe&x2Y?99N~cKo,M@g[P3e^{.<3jdkeEQR8{.H~PJ~.b>Hy0S.fd:!&vpZc7b^6AIGp]vANbpdi][?Tdby~>UlP(%sm1TIjIfI%1z:3uV=p7g?8/RA%31=YgPMo[R&&b5>j.%<6,1P6.0lP_Ss9L9u<1i;@B6;U>*z5]u>{8P]`Z!6~0gF=I#%z[(Rf=XFffLj/iSZq52c%e>2$)b^%1=iQFME{v>P]0De|#MbnNZ]=J./omB@B5abSa|,R|<`<&_p~K{~`e=*o].M4tqD_NZ6BTeg>v~[z]j8*D1!I=ihxmR#*$I*6Gwm*]v|S7Dj}.Dsf#cPue2eV@(8v`_Mf";s(/R<j2YfNrl6KO8W8dl`6hYRbM9bh0Ud>;7hTN,A+yQvjTJ50M_i*T{+![ULs|iMSB`|o.[Xf1*NUq"3(P/JVyK|?^CaxmR<ukDRvn{Gm8CEXZOHDNqd&d`Q>$Sp@syxN0=pH)?M7=]qHhQm8<h)[/)6ig9RO]IZcJ5CjZI=k~VQdQ>=)T,32nULT?|x1r$l&3S2DFpaQ5QZZYy%v+qjuNz*HquPz*fNJ6Ceu7FL&~*!sV=+tNzG_TIu_{_~]6rPa&;`5SrU&dhyz8%d.ozK,9<b.bT@5aL<+To#cgq{2$2s5`Qgk$cL8N&LW_[H(5M]rSU14*pGWrNu3y9?CoR6gg,x3F?o#)0V{Z.RKLQ#EK>^%DLU,MixVCj2p%pohR:>n|i4w+%*RNSV6`hl#6tvdzonWEc:wf~2`gEfs]rzpgb=zY=M5IgguZ3+*/XL|/s^*2^5+5X(80)^6VEf}GmqEr1jFm]d!Z?{Ra!v!au~Pj"FbEXQNt18az<JELzI"z<3^AD])Yz}QYn,AK,OWVt7JuV_0nKuI(>uNWrreml?]B^veG6(&h|^3uUOrJ{?dqQdhKJF9uR2lSGm6V=y1;.f4IYb$I*Zj5!VM{]c<g9(oQ3_`$Pc;p5A~i.!=E&B87DxKS8t8IeDuai^m8g^.JWcPIfOFNs9]$G:i?(aE>vgrSO#|iv_<ZEps>"KnwWGpwetn+,;q>_"`&/p#76jz71:{Ue9jZ8Zp#Vv5;6A//}P2>qS+JvcF#;i6h+%2GBPU8gh{%`_.>g^d_kG8AeB8Ae]`ZOkLgQtMf4hOU6kPxr|R$;`F9]s)[%3S%2?xo,%j?!ESBrm5C*^rWn#=)#/@R[1IH=>Pv#L!K#bw+4O:n_dN5UgsUf?=K<jU%fh)Hnav"=e:_g`(eLBmV46XTbx]+d|V#*ubI^W02#N$jIeO1mnT);!yc.Fk.=}]5X!ag:u<W^TS9]0oN]>.u!z<L)J#3KJl/wuV=pn9FElg/<7aElP:"}$zIa|Z:vywM]:7D!d)Di:r&")WWFV!>`)Ip]v5"{FNW0o@J|_nXBy%_O7`qT$lRK/@i[$#w/PoT:[o0*68^Ud[PrYTb.a8w^k&9z*3&;oHLZ&2f!JNaVQRt|qTl6_/;68]%%oka}v]qjxR}&]l?Nk2ZEn$wp~+e|yG*_#&La_c|Z|=!;A8(%w^4Q}ca}Ak5<1H|gW#RPhr*o4Hu^^%,2Z[NKL$nWpC<Imf>+7g1&k.m!;Xj%Sk|mpvdKGvJgZmL/#wlVYug[$0xG7kA9c%Y:zhVRO=x0,iL<N3vSz0,q%pYJO3P:nkUf!;?3sTHkJyvK=mF^4>^=zI2c*6V&#2(<IFr*[|OIzo(gqKi7H@NS[(xs+s`|_P?_66A=YE?oiTFJ;(^U2>Yj>$bCj2yfqB9Fs9pDe:pT|AC,*v_apLd$EXRJ}Ll7P%|&.m*I;i3.dU~K5c,vlT(k[AKO4Jcm#P(^NZh<TOB:`i#,Xtg"QGru%D=)9h;B5*`opb?qun02Qfc[ZZbmIH[vuPZ7Jq|89kit(74Y5;<)kQiGvcveM)Y_/qf8F"o^<_Piz37(w}!SpVD,dx8*mFSXTkcV:cVc%L>?%vfAK@Uc]UHy.e.KrQ[3EFI^D8fw.QveW:}efWvKX}{A*;B`3G"*EFxo>M66C*bGv,zcr1K@UN;F)q_ybXD~5zR0O0YsmDra:Nh.51+6Uml;A#t;{<@dL</fn[=$07<*lzJ"3@,9M<e=_Gr2iQk95%`jLkcq6TpG{`0m}p)&%)X<@1Q60c#n0cCWH4OE:{4mg[+K|*mN:&0!"MJI#r:pC_TrO@=XYjURSVb)E<4+/=M>|#t$y?WVydq42Ux<F53/mUdYSzEA@Q*DBtlBXEPOvZI)%t*n)C@AowM}@OuF1NZobH3R#*:CYAAAAAAA>WnBSqEQ`Za/#?EEMvs4|d~mM<[1.KApoeZoa`ZWK0XcsR~X%TJHa3hxKa:*zG~m(SZ5y>pkH8IB]+j?e5GhCW#Gr@?*Z13%yeJ8v{<x"&dc2W[wc"U!!.VF&yk?N#c4`Q.N]zp+.TPa5`:!/amWI48ZZjo?[C)gH_]bgZ%^lz_E`+MNu=fz%pV27v($LwX,aPn?:h|"#dOYhg]J^.wT,8vv>9il.[6|nm4iplC~wd~Qv~[3b1OhCNT6kG0*jk3VP/eOO=ryB6X8014Nf1bL[y=fnjPi]G(oyiQ|_^hG}pHTs9^zpM8p]IY:GTyZ}#WD#!e",YmsZN^d9^w77cy2$<A/30+IEBvSg#^#WBSln2Vy;mTbr_a>^D^`wxFB9n6<UN+Qb*3H/]DDT#NuPdz8ltTU:u@*sHFK#f^*J~!i7S}DMlZB^xlwn~h+f^gW,i~oFh#Ytvk0LeQUM<b|$84=W0tPftisa16,#MmlfxMRE(tTfO+Bn/2u=JGWAz>lr&ZrR^%VWBZt0>.2.:Xb<Q35.g0rk(!P&,Nv}}$J7BvW5ohdlXqfH`7TKMbh.tHe8Y^E:"dQcyL/|o_]V5R&^fcZ)>IfV(1/0;&%*XmL2wxLcG6?E,eOcOd;ov0(~s<7=)&wgznve3Nf"adEMn^Z{536e_Zck,x?G"(=){QK;FvRbs7=fm]D=WA<]==a(TgF>TW~lKWg|$|dc!HWL9Zp3o9Ado9+B/z_=zFGDID9{Y"}<?ie;POe_{5M+WquXr6`%`~!G,JrcYsL7PL*|lAc4UHmk:XtmrN[5LDLiZfl^*DQDYMk>}[,e=#e,ieP~ZKb"<%hxKs8/zZ_VNYfF;q>vR)4[_D/&(%lyK*O#.{R2bV{;m,lKDo`u)a?7+{+C@c4Av5H;r.F!J~C^en;S563RRJd:o#<yqoUn;|U(|#,ZO6DB<yT`2R%=;H0%gng=tP7(u_&@Tn+e{KwP<KWafQw"j_cq^OBix_F6E!mC.m],kG8>p$Y^K,"EUr]vM5b/(N7;txVtCEQy@EDyvP`FjHbzg*j"l(/&4/.qQjz94Tot79,Uj5<.iD/]Oiw%~ObZ@$Eb8>nH5tJg1d$+F((t=hGq=3B;n{]7Nd265PAiH:*H*QXRgF(7{{RWNFldFn`bt[=z>Wop@yPGZMsrF<bd+n]eR#~?Zzy0<%nNF062d8S^kaMVAvi*,7XT)Pa>?5B/d3!U`(!Mf%/"<>vA>$rq_{["vetDemzxdS:1}EZl#Qc?n8d.4W2fP{6TXqM;,QXb5Co/jr&>|nuHZ1t6soAP5:h:m0V!cr.Rfu~ccM)be@"^:fSpf"kDH^[us$`<J=k1yjWr{U2M*8p>_l[wJTyN$+}I`C_4iV%h(s1@,dx2*$NA)|xcC(sgVAHcf@.4OV6.HXz8HM4^C1+,)._p|`hMt;9J+6Z&]/z[$k#/]E5~t:uVBWEM<B)^7&rWodtnUh{oo1;R|),RPf/=`<?W`31%x:Wj0uf>T3J0PnBVnlN)+[hKG~4B8Z&<|j:H8R)drn(:+guy3%WE5Z5167Kat>2liYd|b<iO8471:wVllmh"[e]_%/RGIg6VXL|83.7aAv(BW<o0>as+q@`Zq?45:xlBq8n<!O71~IjRYI?O:;L#fPLe5c4Z8hgeYomvqMLcLlU;,rD6r1zC1pI~gQZ7)^J{x1ft4u"M2~WpU4r9(;!+[YyH/ui=W+C+RMQX0enA_$h|xarCnGEZzpI]rgIK:n7q<WY}Q.5$qJ8^igD,07D!+f69H%?u@S$k."]a`L$=W|>UeDh7D=Fl9Cs@dsE4$s`z#NKAYv9xavwn86RuLKdiQc@WHwGeqy&pj`s1d)(|jAs^]I^ha,41=UTNP,zzl{afeh;8p0w`J1pN>j]bVG+6qVQeE!4RjW},)vjy/e}m|KN0rB/VV4Lx,.U*!0r.&:(L9%|]F&!?^wo/l}k}BoUyM~>|j@I>$cqmUNbHx@{oMnPWTu>|s`~$u=v"4.Q0qJ3O}64R#D/[LwrSolZa"=1Rxs.L&+0+XUS(QA+J.Z|M4@v&NX{j#&Le{y@VRA(QE~`6PA,H:.ORzs,C`&M>h{bMAtl%,.7tXXkP)0[scPp3+SSuc#5%>9?3%;!W?ffuen|#+tTvJaq^4!iBYsN((Y`gi{k(^"x)NivasU<<=])t?#+zsv(3Rd{Z}gs7H?@o9/i"Gt6WW8o7vmPt(x<ji;,5N3k9TDHFX_T@cS/YA(&8F6~qiUg8K`hO}TQ:i"F3{JL2m4Gm{3|GBVQ(?yFRf.@hHkbLl9$4W2(E1x@6p:mF[7>,R[n9JgYrB749x_)&6NP7{}#<S!$"NRbsg{:|ce;.20o!jA_U3^d(q)K8OcVRM!Z8*T2F04pk@?+|WSE,c:/7XVqN%S{6EScYwzK`n8lW?Ca]ZaAKXGEj@<g?ucxli7.2FdX]P0K.jBBvXOOQ}nCAB[imsBO?*Dvge!;@=.6i<holsglY.KvIE~k(`<aB;oNL"~NY*RU*bO}8[1`Dy_>ga%cKb|`2e.}U4`K&xAdT%B!yU,bBHcH4%{!Zq{Uw>BY7>LV"F}|+4jLaJ#fvtp#_QC2X[t_o?Qm:WhYfC$[>Jq1.HIvYMsVo=J6t?L|},kBrxbq.4w1sy"T8%*L~i|zbhTwbDDOn_wOazA<E7AO5&^+WcI%kvy(rS4v<MPV/4ZkXw3zZXM|Vdot2Dnfn+f~QI;a^FPTVD_],!FDkS|zEmA6DNS9Ctc}/*|qMYox$MA%MDT`B?e{)!i#wd1cxr|L,">j"`v:A<&*:cV=v{udgWk]7_m$;z>%BvGj}kI~wq7P{C<~woSf,zWlc%R9)WSR`~o<}ib*B3/I+!G{7XtWYhyE?~+a~T@iH,U>;rNZh:CbCR/do[i=]lqX=J{SlaN6pF.tCjKJirdJ*_5Ss[ric?H|1v6/{Od*u{Z*JB"IImOuqypI+D5Z7BDs?LoB@(n^0N85K$|Y7$J8BON(lK(d?H?>{uBNh,=^4}"#Ad47UifXE4k}:@W@SfklWh*a^sLp(428=.Js;QAvS=GR_!i_6p}1eY3?Z#ER.{7!&iGiY@lx7;6^C$Js9~XlH.32un?LnmiC`8K>ao=YxjcBZpkc_jrQ(s.Gbi[c"~ds{(1qsA:L1t`&y.W7l)QTy_UsB@&dV?:be4.mvzu&Pxq7}`ZR!0;32qoV1!m8YjI,6Mf9#GRUHT=!^w!OXb.gCi7Qg*WiJU}j.hM?3u%9jV_f>JXuRn_]cTu+@i&"K<_{PDJE{>R[(^!d^Fn)vU`~|,(Z#P0,7Z3zKG</AG^iO`aWKQ&&fRAWwXH4W)1,JW<ugHcr%ckP1+Y5%;fh|`U",}"EVxM}wsL@uI2ck/${j7M7|DKGPMu};]Y8*0sdbuxZLd2kY|0rX6rHrXzO3ScQU5#ZgB{d{D>FzE~({p9pGuu,+W@uG[!Mr^mr^;n>L#L:G|^N_!Vzp?[)>pmxN9OO#xU_:hot}.!aLO1sY(g:so32H.Q+gvx|Sa,wDYN.oFO?K.Vnxufktu7z)n<55$Cav9|:eHd,2$DwJ.NueCs`i</N1<e|0Pi!hLHfTK?WMN_W$9pBZ,Wu{(BVytI]&@L]G;Jkaq9K=aF*UqN{6Tc*/=aI9*P@F[.<[X*mRB`TPt6Ss~,?RFI1#w]@W1Rm1@>23n8`&wt4b.?/3HDM@uxm?7(K|y4%=.`h7MrL;y79DVk`BKjZ%4p<#[MZijY7In+XY2k.S|u{]{W(c6=2|@6._^G:99|E/Q*yRk_<*0R>xFvc`)(jhBiFjXNk>l5bPQ$41TU)usFwa$FEUu=T)**bQ{8o0mmEuOb|1+7bc?E[O#OZ:n7[nq9rG5s+H0$waYr*lId/Wb]sy;ZB)%ldt<J6"kB+e;lrQ5t9g=R6hD0!ulz*SIizq4pmDmtQ2%EK!YQIk4.GC_5O(_ds~p>BwhaU_|ox:@;|cqwwe.fA:hGCC7Ukob8,N3B{}O}G7+s}^^!Kx@VeAP}J{|3_)J6h).1s~CkY";0g[yg`N4=q&BMG|7Y.lU;U<ginS=D8KiV@$w/RSd}H=&`^(*YiYa1qDbJ5jRMz0OVKYRc*V"|21L1bq_iCXUQsNx9E((Wu/Mh.d/PkWu9/}b@I7lM0RiL`N7|XI$txd4#8>L~zAV`hZkktoMhE`fFq{X+B:cypl2[VU.`Hrw?5"A<%L]#e?GJR;;AjKJMYk5?9a3X#2%8}EY~uQ*b#lE!,8Q``?4)[/_R?v@pB]Y3QC>*4X83a,+I]5dj/Iu[d5wo~GXYvDowe6.Z3Id"iNtXBW/2$MRA(r:e57%f>@++pn<BkxnCer+yt;%w^qlKBf=pT"7^~ok*DnV+$MyRe{x},rngGj$;:R}$3/067>M&ChTY%poJJ}p.d"PCKc8{%kgX@uHg|So`YKZSK]T//e~B<YJNG<{O0`c)a")"7d.c4AOZ,/%.:o}GR{~XHGS`B)Vx:gi#Cu+J]Ax(TC2MWlp5323~<!s"&%#(.Gpaxc}~0*q!Oa|tiYF,([Ce{@yWM.KWhY0e[ReD}?t=h@&M9_zrf;G$xO+hrtt.ABg]d6Z%+F*M!HglYWW[$PDLE%__1mMS3py:K2l5MAV5/NS:Nk5|(QO=(nMTGtEhw"e7Ta8(?Ti%gC`i{t*~Wa2~oOQ6S=N*qT!pCM}|]^d7)6W{~$iftcgcqd.7VEH~TR2avKei~qqdj>|7P+1[)*5WlOnZ@uG!8x{a_/{)q?Kh(jlt9y^[?,$K55vTirD+WWMEw2Df3l?#Qd{<$bd+>kfbj.kn)V<{=BrZo62.A:EK`,H+Z2]}f`*jxglw%SMn/;06cNCE{/|XPbNW>nx`Nm<sr_WIm?vb91h)AiVv]DVQcG5VCN#o5=d,T"ZMu5mpVMrP`LLCn3V=vnUn;_RU$NJPBZ1ow?1y,7:"^+<vOa%;R*<g)@i)f3,_1FnMoUEYTeWc%f<ZiaNq,J?=l4d?L.c~7v]FAci_c+<dZ]wGDACn%yiSEFWL0+GK{(!ZsC1*^Qh+muI{OViw(ggTr}DR(9~Aev~uJ)a$Cg*{RLCop:5q5V?PuZs4HpJt4e0*Uz1mj|&Y#0Sju`3224U?[.k>>&hiRS:*jT3of|h&Jpep%EhM]_Z(Z3uFq^kapgcC}I4.fJ9M:D/I6f^f@ywbW3>fu/`R&sq6u^ua#d%499E(x|xX%Q%19lo@>+S(h(Cyfcb3Js1}?SDS(iJ/RMio1x5Kpk(0+=w[@JvLJcN|RZYPXH_KdIez@wAcw?6k#3iY0|AK;}1*u/L:7=qIwdXG<xQhf#0]BRKdZ"y%1&r{vONuTwe~9(`fJQG9:?(0AVL~{w8r8BjB!ex00M)$]RoaMtdrVViM@D6U:&=r>4v0U+vjsLAnnv*%?LqrEr5!jH<&USfL%g$"Tr%vu+#%anK4r+sc88)E/[FLDk>nnNb"z[HJ:dIlj"]fr7=}OHA/&|!S=Zie(y"Ch)YE,2RXnd/y4M4)+Yr<8tR28TP9^3d[Rbi^m$MB!3Ez?sm#SNKV^E<BHYL|yd@C`$hLzf%i0c&^lIiwW>JvWu}CtI7l!nA*ni4@3ez@iWj%g<?xGF:u$RII;|l#*o/2fzIbJOb{:xOS3^C[c(;N20usq8W)/79rR%8{{6^4*14;6lW=Z;2aeR"54JP!58B>%^H:}"bvB5.6|5[PcG_%<12W<zO,t!pSD3Z8~4c|#}L&i~5ei}?%;W*tp%%x_jHgO1)O+*:HaW9Ja=}2!6|AaOwcJk2z[3lJ$Y<c{LeAg{W.T5:Ii4>5<.yfptiha+y.Ds{?vI;5)qGuGX+htrnT]OnuFH=,e.?Ft}cN[ocSy?qKl3DtC)~YG)f98c&Xk|16OuLEj))5ZGv|CCW<&&NJ^ZplrKbx)MEZ/lpH@(G.Y2yd8&tE(inw$t~(=60GA,N)iCQp;s`Y6YR?bVhp":2}X;)q^YB6mP<_u</Yg=Ff>RyBxEE/>}Cpah/PRw^v^Wwiysu@BWnA2r?|1*MJE4O"`xnLwk[Vmg5j[o2SiS9@D+v8bk([RXy>ZT5:|_)2r?.c9?.zr1gl{n@a]5k#?U#X4/f1/9Nn&"tLPx4@+(wCWPa3bEQ>}[B,SE15:G<6*OwW,&5[[H&BEBlp5PEywW]a0K(fc^7(OpyvatnI@p7;[~38ra6|8=VvP:S7?_XK`oIo^mM?BuZ0,nq>#0l8B=NmHB@NI<QwvRgpbjWrX%4"s*kbmRT7?#RjoO*O<Qp^)&l^W]zhEUdLu`^*P.e:Lo2pz2"^T6kjcCiSj74!pp#[;C?(7ZKWGAm;B{.5{;ynYYkVsQ)nRkF8*$=}#6i*#)SG[@A]qm}ec^XW(raN+X=V&@ty$<)Za`]l>us[TV>.(bTO6Z+7<.EvE2>oG};8eXl^bhwz*<IKo,*@Y+l?Qy%uoT%&i5}~XvYAdr!V*0HJoi,:5x:H@{w(Z1Fa;8r|v0E]^2MS+e(YSY5odJy>ijH10vhNi|&D/^F:g^#w_RJ#R5dC7u&[L)8xW1T8vS6RZ_o}@|wtgECY54FdHo(ouzq}eX4U|Nm_H{!:`DZs,fP@TtwInAj1~Tm)vRTA#QRm]1Cr7]YWkn!I9!9Zy+zR5E8HekTK:|V^&<dYF@dlki6dOPM^w>1_1UKICa%eM%p<?9cQxM)Ly9rilqbeut.*v!j?y$qhL/a,DIlbqF5}w+wm3nB3(t%(Qw{s6sZnh=0u5mQR&j>Vfs^(pZJ179cYz$CLyBjwl}{7Thupi9znFWotMyAi4Ww/T9|7d>[$d41%f)RGy.jRH=f?uy`+aaTNpG@$Gy^l$cZld]fR??Di}[[{J)g`46D?{Q]/Dcx#]sOa2c]nK~!zqvF{a+`8nFpg*vu>u.zuE75j)>f]cCrTG?1}73i70+{1(2cv7NwqV1G,k]GmzS3X9G:{huTw7`dmQ`?20Z|X.]+},h5WCEeC#sYMl1b72z&V@Nw.wCB%1]%^]D$tsn#I69389~)u4L6z?f^ut@`cv?utR]347YZia"J6:+#~oEJ{08TM6z~yrj?c}Ytm6wF[s/K*d@4:LWK{=iu^hP|+G)_#mG~!w,&8:mT:1C/l+1:YZxTgt~k271|y&2c}>20?,%y}9UUH}k)ebpwW&RL#ADDL/=>3g%x/yWXFsrj:~_P;|[zT,87"2X|`h8hgp;=wwVXYg4G0dsbKBGz:@T`,3/Mik{43f_GvkyuU/I:q9^/McWKKGRX2)ceWN]QjkT4mAM*K5=I`L:|5G"21x;rf;a0s}SGt/v*S.W2ynAHuSTIfMX*.PPf4@rw(*T;7}/TL_R9"<)k!+dw(XmhNcbmomcE7%EA1Y[oP/"vz=jD*+U;km%$w{q]omW3H<1e_wv+%5c/Tg6*Sao*0=6j>KP7WNRp8:@`yHm|U&(Ncka@juA]]5dX>%fHCuQGje{~vj>C90_h4>$w!u<@SBkPHUq]X&:16n7{SC3H>0t7*RWg*qiGLi7JZ(?f/4LCPQXC/vJX?s}Y,avNgc$43u"lw5zDzvO$2xj00Bj.~~NTt#:qY@dT$4RS+1sRg0fB}X.vvZItJ8mEaOr#z9g|a7bOW>7@1]4MAv+H.EeS4,s#f*,:}t(?m]P}}F2J2ab:tx<=^WWbQ5NH2.mg!JW_/y[*Ot>UJxj)bAO,kzPirA^LaF|+CEupMf5N;IcqYo8CwF[<BjD3qtOg4zMi&=<CS?qP3@9_hbxk=_+C?z9oa5d&QLazU>GU=8u4A!|V@9REje9pCU{}z<>1S~_>:uSySOq)^yjq7`:0E~%2KReQR]KJ,!C&ay!LUkZ6>1{2z806F<eqY6}?|wmOBL6;e@0Z=hM>Xn_Y}d,P},?U4>9)e%O%ej&,vPw>jAU#^Mn~`ko>^;E$efXcAfX$!U<#5A<r}r3hYd"H;jtgbIazo#`.B48x~A2e{62a*pSWSOGO3v7jQ`*(2=QmQ`X:V3k4jd:K}&yoc;`HL$6a%|:BLd<:C*skQ`DQ=%P0b}&UOs_`ar$Z79/k0`];o</[FjrL%MBJ)MxM89]awY5h#UP%IOX8AgPoy&s*6$"+BRdKC`kAv&IZgKg}:Z^wBHCR;nHZg]?)lV"f#Q@R?v@Zq#|co:eYb=OF_+pts?C2M7_G/eK2O+^Q_7;IYfeGX114:"%Ef:X.Ucxy%s0!!!FkmH@ukoHCJSjJ)2[_(by<nULs`Ji+w(}mP>jl"}W?=i<7,Vi)TDV.(/Q?Nk/S,wY[A)bZHZtz)cXDTVTR>x*y/EJusc>Va+cDf_o?k"Gnl=IN7`c+D`5sUl9t#VJ]&C*TfUnt="rwO+rv{)22,t.5<hZ%pEO#Vn{(wthY#.;If$W`c#;"S48fl42JHsr*eyk4WC/?/JjuycKJzM)t;gb}l~"*2diidu*LmwQ9*PMb~V%H>SKY|54^:Bk<fuOv0kAOrc7;Q|/o]wksm.*3b~oSV=(b{l5I,:)jxi2vo/46@[!/y4JMfC1*]XSyb4g:.Nprx[CH1V<|]H6SPLWw|}*q"=GVc6Vlc>H#Gk#>4bX]wq$[bJU{~SBNY6C<_9+5`}RkS5]:uT#w~u=kn0q=yeY$W,[QlX,xv=hse)~Fo_!BBQ~bb#$rIq=k.bw*tMSp/o@#2;mGg7*C6>Jgs9I,iPpFA^Xv+.ys=K)D/T}=^3(Q2hx3_jL>#IaS;xOp)6?h#>b!3{(<1r,.2!hm"?Mc>3Y<{`2s8?Ox?l$Ggi@T[s+XY$vSkW97)ek,0;V@)(T!X;IZLw7t&.Jrj;g4veKc1dWnTF2Jk]I@+AmDx[K$_QG)|z`y):C<nWL|Y!dSw=>;Fx}PW1l4{75D[Lrn1m7_tW@tCm)r[w=3#xbn#0:v8J$Etx5.AMM*p5W/^k9aj;r40@"T1aDeQGmgUX<1$y[H1[tpUyUCNJZ*VpIjnt<&$25bQBd@GN[c|@iGIw4<wXZZICTFn(c|N@e:mN"K<Zal9M4%gGf!qy2/Ia>6/Z:R0*4cMbSL)OnlT/=Rmq)GPs3PP>X#%aC!!s%GJi^&dLwQ^b5a0jFj1b5gbR7U.AK#RjKah"yV,ePj5q}b>Du7~2lIF]CyA]3ty,QVMb"FHjjhj=VkX^n>tc>OXak[^ILOk}DM%?HpFt0MtF2`72DG`}kH2`&NiG_u.WB:t:.h&m6Ss7(N<0sXLjg@gq+UV@BG2Xd[P~jNS:lAczI!(I$.p<L9fDIF0aU=zP2N|.>e^PeaLc(H>I#p&bu1GcX#%nJN>Ls/r0rcG*+(wE5[xHA^%m[iDi!i&&+rhpL85uAs^9A}ys=;]Q^sP}MO/,Zzi`Y/`cB8]#pd.lI+`5@f9zTI!f8q?S.>^J5Lin;2bZIXoSs0DtO:az#H59iXBlRs2@Qd&9Js7w5b!a";9peIvH543E+}6,h,M:XI<;VZ(N3N0OQ{P%r,p^L&tsO!x>QQvTe4)alIL)I:<w>Nxdd}4K:=c7ThzSCc8d=(a19Eg01SLwwI*8vH.&Hiautf>t9q,@+ky!m%o`lmg[(q=VIm/N3;5yG^5xZz3DMBW~yximGRVH~(qGj{X+Pa1s3MQn3?h;SXx72Y7plU/n<MtXVc<>>5Le{X`n.kg)?5,aC@ib<(7bLCE([3C=J+J7#prmw=/ldB%~tm,L[l0xWb@fe(DkphB`mu;HrO>5A~@t4#[}B$cjW<G*8*e#b,tUZ+dILxVU,_,>)|GtZ%;)%/VP^?3//]ba5%s4VP#!dB0YS7MpA,.D%zd.O4iU9LLEO&wm*}[t*U=kHgRv?ImM[;l}>qt4@57kGVRjdSWy]k{xXT.~Y#|`xh_LcdPSCe{qX<kZQ3":XS8].N|/58k{U]Mm^=k9d,gsqy(MJ8.{3KKP]qZBg4r8]bq?UCX:G`c*"PJlQ)+I~:*rB4#z,EoQ>s7*E+>w$v!4OrU&m}cGA=6`fF_g4_eS*zf#8ORPC)bF`X+k3ubV7:C7$Wzy!FE~[]!9serLdl,sp(@rvtoQdSp^5c*!/.%&|_h8Lt;RD|tP+o3)+y[]Hd.gg,3lS`2z%IDo}F.<*%3YcG|B.!3/92u3PA/.P+<UKfO>HaHt$#ux7T/ZK9SA+H~@yvFwVgb!L]Wx0.&Qq$PBPs}j6ok!t,Z}t2DAiWGk)((FJR7WqzEHfiowhRJqe/"!mSWGc8apS+Fov$Nh7O5ne^IM(c}#14=Xb9=ujeIfUk/K9<r:+0Y[UiReH@.*58hsV#x^4Gz/`yB7X0aEWD2WJ:lXWRJ*OilRF4]pBwii$1:FeJ*yNTpY1pI(H(j#jeti^1JtfjkF#;jIEq6=zTUj<PB5(Y!:T(*4Nav6XoW7!DZoWPH/ml_XZCn%=vyZS8;K=g1)IJ#h1(!t6e~<NjLb@,dpxO`O~%R=^o,RIDGe>udyotkf>CIx<Z_469x,aI2nVt"m$<0?}?B8I>?pYHIQT8E:/s*D@mlkzGP9>7`[krX,;Zv3.</}IW5T^*~S%jHyS]m:MKvdWY78~N8di@={AAP*WcY3e3%wW<^6*0O?W?Jn<o{hCk~a>7@A<Z/LH]dj;_yQIB<IzNuh(1KLVW!Z=0e*fPRh!6Ru~ZvKO)1,K$%t^T$=Z1@(vwB;_5IQp@o!TD;,".oGNs.yvOD7UZ(dyFw7]>0B#wbt)8kP;qk(EgJJ))4)Z}!0/#{B0r^C6db9?^S`8R=]8NaEjI$pz;dI0z6m9?Np=x1D[zO/+^JU:J4(05MnoxVQCMBn5B)6$v=]Z|[CvzcW.&FAu[:%kVQYW1#x<Sr&k8B_C6@::rCPBG)n4:$P{e^c/JsRLzMfVk$pg{#g]@$@,0_1C&by:FEd.2WHk14nBlqK)u8+OWckS??r.9l,"/?G?P9(LZRxvx~w6TT0c80*~N``sto"@=VMUMt+z,Yft2LDVT2WrL1?}D%.Ma*OnLZSO0=y7tI4N+$fJXV+qwy2{U^Y,v/T)W?b$s|DQ,tf88obAq/s==0L1t{QoxRg.h)^O_GL3MV6ey|It@}yr!]k*VI4tU$Kh]5W,@?<nu7M>>Y6#(`bMG]"#zVt5plOjp<ZK9m;!G1:Jp@t^l*.dsS4jQf7U[p{y~^Q,f3n>O[?{R~%H|G9{/THaEbr^pLYov,nk;LHzuf#lKxV`xC=:BR;/OizjV$DO<Vfm`a.>}|ecoaDzy1`Yyi,(itgKS}8xW8Wa_D%Qn(Vdl)>JQG;"0}]@p:90Cuy..xAgm5o+0n<v"*u;Ddd]#{XMryDx6VV6he,kVQogW!T;eSJK~<hkt&4<Ra/)}!wf_?)W{BTn`P9e?)k`,xo#L<)7qq18^&kmv`^4$AO@91EuPa1:+ioJh1Cufv+ZxzZwXf/*Rt?>x0t#"Kn9vH1[z4BnY@2kT`SYJeZ_6xG]DU+2.<pgTX,.lcjRmy4P|gr?7sE+Ui9A)qg^D5}B@Y+^<>J{9m1}T0qg*eif#|^ufq0B>"/q|`+9S]~w?EX:3=58,Jg(Tx[wvITT$g|"Ev{))V2UZd>v*_&}2fh*QUHg1(?W7)Z/;XTI7+VWFffJNPZAOIqiI7[&*]8q)ErGyAgaz|03gQ<|CG_pfa2l1uwJPM~D/8Rkjdzei0^ZfJ.}!Kaa{g)0`Li(5x!~3/:B(#hQ4)Jg!POJ6*sG%;%Xx~adim%<(IwxhutMdt`3<iham:"[3}>j`Al+O#oD5D8O],!oSOp;bS/^J|EM<Q*NsY#pc#i}ffbH+1Ooirf);S.6OZ{P_x7:1%JDJeEx.t*g6_,HBrn%ms5{tKM4q%dHXyC}X82FUGDBos03vP:N7:3]WIcsoc:LXnR[%6{7:N"!tJO9^_cRTqj.i.%":%E+,.k$;:wVL!G[Hq1V3f=l0;fyx6,HyJf~q[4x3UHQ=6aU]QI:iY^%!RcaG#ToJn4kH|;9>NK`_ZWi]tE<r=JR/G;)y/(|>[XT_k(#Qp>Gu}_O+M78J/MpO]/yL)1`RsE<y0mM30abmfjAk9NdL.fLe4@7U:U>{r?Q1]cY/%a@6rrhH//AY6Zm%XaFT2Nl#E@RVD>98+]pSB}GCGO,KVrR^7jGTcA=@K{Y8uq}Qe4(dBEQClt2IFvw6qoqL$o$38|eKu|#F!]l%}8X}?yY3VA^_[ZKMJ[d{Th%sFA;/JQZjiyfHP0wFiK#|WerL+cHs<$Ft+[uM8%>G,"nIDG0[q4Ta@^wbQ9$;Lv29q"PZ0:s4e`^v#p6KQpN|feM%Th`puoy?Z[U)_n_EDbsD0xhB#uRQu!g}[Vx:90n7jX%fo4%W5Bk;H0BLrar~CgXWQ{V_(K8;jH`=T;lcF|9d6}Dxk;Z&1OF|jg;*x?Kc@$qffS$plQ!M5OO/)3GN^i*$<lxqvex:3xGg/nH;A`N^9lu>dn%[<G[TW$g~!CS[tSBPRa+f&;+/)M5iM|{*AU9)Yg$4@wAWu`ROA&oWi(^x=Vw!JLHC*I?.HlQAA[O~LguQ%lMU&sP=S)$nXN+spA`#u@H)gsE.8cOeNc~D75vJL#"C3=J,iwy)+0"%m5S>F}E~%9rMJym9"D/YsH{Fc7"DXfr&BNc%*h,L51dJ:$45@0M60(Oj@amurjGx;nL<f?{n)2TFn.;o}ZEJGodr6Jfb6>Bi5T*u._tHS1n?YSYx3xLQW}>^*av>})QYJ;3blj27Vlem),0B;#,N8;frR)~ZZwK}ou~xv@pE*@HRV}A^bAbo0$L{Wb`,$@;&WqKaal2ZCfG[|5OfG/(&2O$JPCq12ME{m5b3282ifiZ*sM>PJ0#l4).rNK%z"@9JpE,lkHdlFmFT1~)/c!j7yGDzq7uPf/w~L6a@m}hT(n}qdxhF{=N_Em/t~{E]eVqcU9RD`=NzT`;(=eC&6P4mZfdWb8]~#r:{KeaOP%_)U[+GX59JEM?0v+AK{~Z^S6am]J"F70!VhOKFU77;Bd5q/V<|s_NBFVmu7`$EKtipfL2iL>smeV,@pelOQ;PrAjB<y$vV<O.Y}>t@T1Jd6h*4G?W=6wMY:h=8coH|0m.uLN0O,1!Wz::)$4rxYo*u`7_`50`S?^*+jS&h4WaY{n!ZZsg&RZUA!|U(|w?78=N3#gEZF;]G$RV=HW~r9Ykg]:gj]G{=f;nP%Z$l4[CVdc5iL;l40)ht|op4kPpkM];2=HE)VQT}<cnIQD|I4,YHM_:_31)W$spUvdk5&(6(.W48pZ>go2c.A!eP^v%^LEEz=6P*@6G>4:%RPM^;!e1G>%r*zfz|OHP!Ul8v|mh:JP7eXvs]I_i*]9JE"D6X_3$ox/dS1:A`_~P,+&GRik)*A43j39(x2}ElGcmCa@$Vk3vwmGgbIJ3#ZQg^a7aImMFe+Mi=5{{eR_%L5r~GHfvig#$nu=K&M>GdQMVeW)W~;/gWp1bQf]{U)BxwvXC5RL&=!j@9hZ[I[S*m%on!m|g?n}Lt/i)C(ef*eOCd0VQV$U#X;jb;Ee6Gq)U5tn>(+`;#rX`^9q(+rnL5ty9$,Q&rjWa8;%T[Td})5@RU/b3pk8^pP3qZ0O>)J^LL.HtyBTbhX@WJp+u_6YlL^NhWSRu>*P2j[tg4AzJ4|L>.n3x5MtR$8SD+bfIJ]`xdjYt,2.}Y]c>1gxc+wG>W*?$!"hWINO2Iqm|T`|uT,/{GKD?KD1F2_:#4&gl@Qf3BpPs#!4]r%D`B0_73Uj{K2V96u`s7(3N+|6MURq|3?f8FYXo%2I:t!Y^J#G_~@r^>q[%6^"j4RWA(qYy:mFE${)Zd]f2O`o2cZvC}ss{WBN?[TVhB>0DM6,hH4y#:>3TcA(k/#IX>$5tK)3UGWTQb=#|brdu7N)Nx1Fi]i0B$qv0+P(km8]%6u$$3of&5QkrGFWhnyVPv&bhZx`_tife=3vfb4C<DhX3=t&txxRYkU74]+l4CyksBhH*`gX&0hF_LGec721s]nM(XXmVCx2Rq:F1GB:~aH7?M&H@MPXmRt~+J/uyu^?hzp!WK`<mt~%di9BvRLQox?)S`rG<k:~=$j)O,98Lw>Qr(VV9/2^6Ef/l]_HhI4/Uc^Hxg/:v){dTJscMLq^V,<]Seu;F46h<D6Yde]Wk+ma>z3f(KT!vhN6^|c+{2q>~>cMS}mc.j%*:Vv="}3+hC.Q]UyVFGl^ak(l?r~(z"[1EWC5NMS)`J>5)$fKWTt29B;TN(w{p!+0D1vFRHc!.+!|b_hx|=#;LLEpIPCSUTe)/j#`kJm4q%J~sX|?Kak0$JR{%T=9F>14R+%PHtRw*mS1#aQ70xFGuvmp`y"r+FKUMU3]o?eyLD]PG5%e8wcrmyDpqU>(Xbhm6f3h{%~`}YIy%zdy6_/gJ{ai$oyj{XdO7l9AW:wJWaxO8J0g)/8%64DU@WN3[vir,MmcTEE,A,{%q<((h2S>]fp6KrNbZ[v36qCuv6:t$&58;WJFl__qa:,tXx;x]"I%5oNsLu>BZr4aad$>]hpQGBVr0bi0%Wvha4.J{/ALh?`hs>^bwSQ4a&N~miL)[Ww1agOzw4(lUu[d{H4TS1p^^&~*^;i=0q28LfGEV^P)nL1$aP(P]^iRKnlb4pOT:kv|&W2nUF}W`c>LZ2ehGZq`;XGlOwF%AmFlhnr~#+M%A=sNNl|MrlKq7G>*1VPN.}wwi(G:Srd].#@4a(5VSa}=W1u.NE``3uP[W#%lmzuTelv]>"FETMGO4KJUbn2CIqgRN^;J:DOT,TIccw*proDI^kHLGO8m|b<d}bwOv.80%ZjC^x$9e}VF4bUfcr._qL~vdxLv`@$SRI_wT??qlf?ILib#HQr]sC)YKIUt:tLPL$PFbP,PDL$RwQMiw78za$JB{;wp)X.dEjoYRr5iI)g_vn|7yknceyFx89ZY]NP;8<&Bs_w+rvb9"gjN1<Wm21yDD;j5Cvf*.iPZ]JxO*,1~kO)$yYrOQ:<P#@,$N}!PWPZ~,wsmFufl=#P$z+ppmeP&H~hl$$3?!]q/MIiskMHTOtTF@lt*1Q^va7FF+!wzC,N{4Tyq+c){:P8|euMC;_<xoj~t)2$+W*)agk`^f/ThIb2y]aumu2~b/M45h5$IU;[>LaM0*WkDx=hkuUyM@r_Bn07m7b1c1LV}X[.JF^U;U""D4wHngaK;kq60uZ)e<Q:1ji$`Q)^|zPrwWTn/dKP2bDDMlY>>Kr_bFn9&6iA4F=/Z>Mb&>Ds6$+<1!t0j|n30lz7qqH=Mn_z,L7I)|.PWhSiqPfn7K9TO/J;C_daj{SH=NnR2WX&/#6mzj8Q.wxy2!x.Y}M=+cJxyvg(IlsS~)+YzCws<K4Yz*CxYpr,5sOKIyHR4pyTbXGjXBM.1yN$E`$m5Zxmx5[d)&y|!BB!($`!Sh~=o%9j@QJM38,dYW_>GE58!V[JPJ*b#qRU5:Dm>o]@Y6__0Al&R}@:K>9h&kyl_5"5:d*;j64X,Y0U3^V/EU1LQcj|yNP6=w,`t&v~ai8.*5L*7%WPgkGLd`t!1$NX(HlAfG!}T~FonQhD+t1;TG$Gf/9h6._&Fz;w[hk]4jw/WO*lf8,oaPy;_M4UQ}JP2|fCsx/Xy$L+ZS8QICWyJm+i!1J%[%8N32N6r1!C:+WAf3i,uDyPJhPb9!*#!Npfq[X)b5dxBdWz}"i,FVxht[ZoJ;zr;;jGFFj=O)6qk=nbBUV!iEvf,:5I/3x=5n:"UV8=4RY7(l(?Y$9yi%4W)x)#3O1^[^G*xBul)~?#jQB2_Qr;2V}/]#1V%xn[:iJz@q9<GMRoeVoX`*nGc!|o>%6^F#GdeG_L6PO[PBV{/9jf.0O_wNT*Y?v8_6Yr7|,Y,"O!S0<vG)+8|vc{dMbj2A@3e"gYx9x?`0TWt#|8h^wsw**D(@BWC[iUf%w!#jlJaENjlxEc+gdE^vDO*@1MszHE*`+`npG/L&@~t`dLy#T3ky85vBCD_I>$[}=>/;pF[7!9{Ipo|<hYe)a0Us"NSf2vhf_28J.uOoK,MN5@X9:qS@m`8o`*&Z:[]`8)+[wwSEFI5xf={W{0,yOZ&A"2YV?:1FHxJ8CCzmKQ8.k??zT0]")iG2;1&xRJDy:~q1D),Y?EndLW"U69d$n0GB.AjdP*o+1v!pk/60mG^AWN7O.Nk8S4iUK1ES.lk9"8s>tMK0DY/5{NJJDx+Sdk4a(ni#$;meIv8=Czp*9g&QlP/$TW]A0?q:ajR<2YUK3@4*RcxvwdGR5zmU$7>}uQE{msxJ_0c)QVQ_YpGHbl"G$gS*EGn6c:R%:CGDD{|Gi8MnyNv;ihZXQK![:HWC~+7O{1G(u}l^bSWu@*SUA7Hb$2/;()@35;@_x~j}@`H+bBJb$vD/%gcp?K>Ya/e|$@=m?)fHxw3<!*zFUZ`+|f;7z?tG(anfr2jXrs@UBAo1Da:{,%[7{nEmb_ts:oLh:nu3^~HRrBGYzuF]CoP8:P6#kX>Hu?D@>?LCt#qe6WR;gdI@?0NiH5tbG1E|#X{E]Ij`1&e#R"X~gF95?B4*4lRmz]ZK^bQyvBb/f>muZ=i4urX$16*CgvmF(mp;k5{f[lIU62CXfD{GoS{{bRE>)CxLrL7)`#CB"0$_aMUpS)]KMR}lt|]SHjdqKS=<.q2uPzoT#XgT=$Y;f}V3tSqTY1Ad6~$H5t1!$z07.N#{MYea<djNVYMkCUHv0"XAizOd3>?rhPeEStT^P@Jc=w+HijbH^H~*@Zr|(~om@ul5T~2a9vhIMHE.Xgqg!;`yY{u](_h??ePbpXsdiB?|>&Oijo[.DP*g+^z(1A^9z2YB%5EeytDD=~r[T+mls.L+qUAPwzn8qY|Bvy|itQbJ(U#JG!KoixY#SGu58qHkp.T#rP+OqkI$HRK2=dOZ]Za)!pB"QE>H>9J6]>!]%Lxz5_!1SiCtF.29[`u8@[c>Y7kPBHk0L8RMFEj.DgK7Wr^#[oO^X5Yuv.@RPsMhcb6d9^Nd&TSzR^e22PJw`]9KOl/#mV5%WlqL=QZtX66,kKZ>{gh4Rfk5,>VmIRpaF;$ydGs!=_iQz;OzSZ3MPA|/ONSo}aCGmoN8Gtwgl.D)ou,N.<<[+!F;Pz(v9SY(L3,mC/0iS[DFeR=5@|VHm_v@H(t7,hcon.PpuTZ{+DILO~:s^|Ttz5]"NI(}sDt"CN1?D;n$E[uJ}Jv*Ym9[LZmtpA#,GZBZ%9~Q+pj^Fetu1+/Nl#M7k[Yc/DP!mTSJZJpBo%S`WaG7?~0%Y3M/x1p=c[JF;)dQpDVCUm>stOS)<wz"dLC2q)2qh7Mml`W%Y@VL?V{!<*E31ZDPTqx;ix`1(RslxccAtxOG)2E)ymGO![JzO.fz.0O+p|QmZ#Vq.%#<tCx+k_~tC72"N[5aga+(]^DAiEp{.A}"KvuP8u9f&Y2PB@H6nwBu{@@ZkRgfXQUXQ=,Ycp99brd@}F^]j.SgcED*j91AIB46adLRxnDw,Lg@u*BaRLpB8f*98_pV}HS>cJ<m)!8yn=U"1LmQ_?(J7v0?)6oe30!5zxu^c!xb84Vp3gd|uUO_!~/C2nTp{U"^e?XNS$761"X$n)#z_TeK`uCc66W)*dPNe}?B}:,E/Lw6Il:;YQ0ewEDa${2U_)%?S~6npymeHa`1oHmEJR.A;k/7*4#(.KEsnZ*r%"@<vwJX=za=ev}:B1+|0rECDS:C!SWh4&8A(xd?;R(Na@}geZY7R%RgQ!ufCr45vj|49iz~oohtzAW3SWEBXj)VN4j4A><DI::n*NjRkK|KrP(>hMfucvHdsa1X++BUjQ5ntCz!_(%bFXK:r]Y/a,MHceJxIvBR8:>%E=*jo75fpv6tYL#wA8HoHHl|DAP}/W%@g$pe_,UWD&Qm;P*|wY7xajqeXg&P%]dE[1{W{Slm;*a;6VdV<,3<.?k%r:RgwuHWE(sYFgPA8gc7j._>W%g/:*%r>;C2=/7i":U+btQ@#9n1Td/4YFL~pmcsn0_]y.#3[#fW$3ZW<P6:%%H^=xB[URL1?Pt+bS<Tl<dhy87.BW*:A!w2V"9R3ZrOP/c(!}z+<y9t!#jlgl=fjdt9++e;EK:x[=`>>101(IP/]9Vw0vvMKk&60&8B[yiz|Bz08p:!UbJHqQ3);Xos[y`VkPJN[+:qwJ!&c7[&L5UGx{v`hl*/}LzZ5UF:F"RoI!QfdbIK6"CoIq?i2lWgLyRvo=kB=~bg6|kAO4Va?(jqtpE#_Fi}{{s3V"`S}&+V_he2yQh{UYYHpmh/^eq|1`7q.=wy:OC$RKEdUG&|C)rJw?6hdTUEQtIpd<g@=p+0?+O1E)N3~f)t(O{by^:vc&2V7/Z7G7tJ>(O4qi<}>#w;?bJ!)L1~<>H,cp|ft.V[>iSbcA|*mvGNUaZ"|9zFi.(_<r]|SF/d%p?*$7U<:V>i;5,XqRuJbC=]vAZV9#DmA3LTxy3;,54U^VJ&+8<mkRTSp600/eVQ#0(m~Sgqr@W*_s8Sj)K(aem6xIaL_8|5Ey(b+*)]l8uREpl_D1=NA@HTP]x+k_sWT6u(QQ.".v(#5"kn)ZxzC$?rwV(zPpYeg{k%|Fb*e"~wZ=*t"QBk:$SXSOGLYp<c>&ZY3XF^+uK#]y4%#q&~,4ial~XHsgZ;2.(`*s.gagDd(PybxOVE."*CSE!3B>{nE"bN3~Tue_gwW*r*Z}:L##]b8eUD>)P=RW)Le.5#C,KL=obUx~MA_{zY2#mYIqF;Nf7@1<FM(ia>9E[7h)gLC.6B2lF_(RR18%idIE@WHW0r)Lp}}~$}U~m<+pD(:YL^RK4(g,P%chC,`nH&KgQ%~2wV8^H5obOWR.pL&7@Nxx<&k[x/IJVwUdokRP=oLi]ZQAY0pnaE:t}Z$o,Ssu0gJ$KcCgH(3x#dD1g`s2b<J73h!Uiq(+[c1!gv7Hq2z~>`O0$2wC(&a"?e.Y&<d#HB$=d"2R3tHjwqnC9)nvb~(Wex8_{=.qMQ`1vu)/CO{OW$C=u>[?vkCEaKYlXxUf;%5;H/&{u%K?{W_9)qk[GtT8h)Mtg_T[XZ.&PK*{%]+M{@f262(G/fQBUlUg9G]}Z"K46k*h/^;^4HK,6?bv.C)ZSH,QfBhQ*nDJ=I:8FH7k@Q_tGgm]8B&4r}8lgCOgoRYTX/u74B)m,Us~_Blc<iwm%iH(WPn2nF8]b@ROiu!(&ZJUJJd~?+1:3n/ry31gJy#DN]_SH|x+^^G1vDNAedEpJw*@nB*[P$Gv9TnZxs|pLbb|u{q0JtIc&ks&*/4A*I`.aqP|~*OR1j6j|n}WODQQ~@}xGRS;i5fM|x6/doN}yYU!ZaY#Zm@{AAu42==&rp5OO:lvYZP,aUCS4?vHTMY;;`ND,7^w^Nw*p[e?Vd1&mHd+=9FLmIGVbh3L.@0|`7E5TgJ_$gkU?m#]~+y26UU@ibd=f$QiV1uco~Wkx*nLa+N0(|}L%7R0dlD6[SUrizOr[v+=Di2"=?Vyb~ZPM"2m)9|IgA:q),=ixp54:lqgDg.,!ciS7rYM*4H57;_7=3sM^oH0WNkGmdX+_o>1G1lm~NtSmPqoD:.[_4D*w:@VhEEz9.d"Z{QA}2^+61?Noan6/SuM_QjXG8a$([_J.s"{y^I=eBo7tAzO^QG{7=R5"C+R3!pIb~_j|i~nS9{3AI|8,>hn5>#C{$b6t@/3T(}2kSx:H;99&d~<!CoIURFW0WM$QeTscuU(WfBZEMB<F)1ePQ>[8;l|raV{`CJ~Dp~3;>,O6k?D@]|8<tIu?5Cj&[nU06C1(F8/riv!_VLJCGc"N@Ig7(1W1s#s!2raL:N%]lB|h.hng{G`M29"Ys+?(Hb*<EJc]QEE3]#fLJ=Ezy20T;Y(&eXY[./]{._QqlT.iMj<FW1<9M2+{e0Cc,}%k2?<^Fc2NWegR,jd/ngs6km|v7MRPUj3jEzoczibvNJHe#U|NBKO)H;Et01X?h?zQbx_|JO"h0GhxGNtAGpf>=z:ghEn?{Pp%K*XSI;p":[ip4Z8^o:,<l.=MzCk@mb)dSQA*@*u?PPW~Be;1h|TU83:10I#SJX]6zJ`;x8XgR!ZZbXzwBi$eD"+tqmy:Q1D(16F?i$l1r{;L/wFvE;6Q6kSDi^1%L3{2UjMr:[t_&y%D3osqc+^Ivue8t4"s#W]/294[nFPM[:u26}j=T~e:.C|pps56Hrg+%JwnaKrzB`:8)5>2bHC{k)O<a.bFf0E3N8P4&8sxg&=54}l1agDdVxEnpY#bYs]}fVw*/vh:"h/]KyzZgj/Q^nTQDv/?Kf]&/:b@p83pl@:aDtd}Y4@L+5*JT{Yn5hD|#(;6NA2*.k/&^svHpiz{j<a;jW5ejm?e8)6#!a4424uzTX+_zhus3t,NuS~%d";0%%9b}tG9S;4#;6[w~,D[l.oHS79|jp=;M0>o}}p,.v8Xel5x>XRH+%(W)n[v[4qqiyN@Z?xpU7|i}S@>b_.Tnl=[o?k?_;U|481(BSGY2uK3/dd&`}$cO7`9]Fpj5rcJy6o#^2La|T~Ay4X?[5(m)@WBM=m%Fi7Bo6Q#rSd`vyFx7[mpW`u8cq<1SpWa~7(kF]vo}5tdXy||V49w"z+VOq*+];YM(I=i57WbV2O9"<VyTL(v0hSfYSHN1rjYu@g]FgsT<79"n)m|&1s4pqFF#I_8,v>t"W&P7YNl6q+@pq6w,I>LOMWpyCHYCJ_U@_q!qLwm4bww%!Me5_e)AauMsTM{)ALhOR2[v[J3D0@b}OQU@S^?T[kiU!Wg1o?#qE}WpRox*X`fI`ns2/h,^(&A`v6@P;b+0:w4]NAXm[#<(v@$>H8CFxuxeL")tH{WEMN2h,C2h!(<fFJQ|+SViBt2FH$R%VvoU}}}fkhbQC~%0$yW)]_`12[mH3zz;XzG=+i<;v@sX3YuBk^[J3m18W[Vc1VRdqupQZr[=kvG_Hu!dzOJHlz%9=zp0uZ2nP"MM^~~$bMtQY`#+>#1HM=u&#mq/7!l=1;E]c!T]0&]3+yeFzZT|W,DXr35A.>H}{[M%13F@[)5lc{O;K>Xg%lc5ZpA=hRi8]8a7&ZFIi(aR7VQVm=1b#16??|fE4PZN!UOx.$IV3d/HW~2}#63G/qCCGI91/GWb$!BioQN&W:#p))zAip]/b&Rvk>d6qNsmsyiel=7j]X?)yXSl>8<MtE>${9vvz^67=i_L1f`1!u$TD|fwJFY/T7L~N$),>$~S?coZP:([&6reUoZ4EE(|aF"WU6.>^!#16zMK)&x"dV[n$:vx,<K@6bgZ$e?PNeq{BCUV{dsy.1H<:>{jMM<o7d+M&Q`b(u%/s~H,p`ReclxJ50{]"UZ5^x6,P7`j<VoPO5MV?l~g,YSmg.KW+k^*+nF|)bW6r[K;t]CVx"dHOUq2sTF70nr`Lg+yF472p:,AdhnNzr#HgBR4Ai+4v`fyNl|WqBY?5v?[qx_!^$A1?k_>+c:MJ^Y^j!S59X%{>cWok{4ZX8,OT>)1=8)2M9/FMJTDj3m"bKFdA(QX?jaAZ@4Q8(p5(/3AZU4zx.O|C.aDO/|9)@:0S1U]T`B*87~]6Zjp+_:(B<=Ex%jl$|B!/DicJj)<YxD4yL23gfDKrkY,C"z*0JQ@8z+W`!=nzkif#Vg/n#?Tm!^?jTtK245YPbS,E|Nij=;jl8)cm,Lm(;3(`I(7G=EPDX~#o~(Fb<Uxuf3bKsd/@7!aRmFErc#w,svVCrC>+E;Qrz($%^H(7HC/oSsd4[9pgJ6H<L}n_nsiq`0e|7X<YTa+xv(*f8a%}EYrH0G`F=(enYc=L^]?moo=*o<=LBY8I4Q.<q[<LzM@;og$0>5hmre)EPCB?QfjY#mut%L*O|X5_/Hr:78>+^.O~vha3~j$rG#]6=n/?6N:3Cfx9*B>j_Ty&^.6pgt?fNc:p?bR)jmI}6*$[/48;^$gzDnYId;FKB3e={IBIzO~zYw:3kfx#N|Ghv%<{:3:t,8l#*26r?qK+vCgKj0b)HjyMIH6Det?yAec9n$&cFDw%HM+;Rm!x^n<M.VbVY9shO8]ZbpzNvSUt]{HK]4J$omU6.;N]=!=_~z=yP7$q_^mJ&hJ3o=//FXG#0"Xsh7{8(phU1dpgpPl:D2!ri%<d2Ls_@]4DkIUed%hH)7*wZh~51I9i[)@GM.:3zIB`&!~;DY9;VaRlp::rjZZyJ_!G*W+JCoaJ4/+$X#YWytBNu5f7KB)v&P8MfPY*%Y$+:Oh3^i@b"x.U!+wma`%_^Vcx_D4hlKdGZVIMg05<0i&|xh[vWu952N~r^cvMjS"J+vw$^D~U0BA*"BH6Me2sF3%Ean5UI7LPb*b0h|6opUkE}+7pmH80OlBw"=W,Vpr*Wb6_x.XmL>^C?fzxCIfi6/LL35W4{]_}b&TUJNUepKQ~o29VVPucl#l,vH1owFNIWe}NiQzd**_)/+gRQ0)8K[s?~X6.e~NN?3dJJ,[@R?2=^)5Dv)Oc~dPN["@3``_v:nI3VCs]5U9[/16[q.h*+C`F3qpbfh_G&0U7V.$7XS1=L=h#1R*5U+WPd`%Z!@i|2~bvgGiLvRA8*~X||b*H6RdONphap$5lup0AAr}><tm=fJDkawG0uVUQpoC2KwTe^&ZR$m}^^de}]/PW"*sFHKZuNwkast$Z,NFi]aO*vT0z]ju2#hktwjSjMg!G{r{km$UIe${ev>I=H0B$#jGKyoQ`p;:et9Fr>4m?LE&$:Xn<ZQ*~kz%9)o^^e"9U7]F]q}(cS8Mf8Tl5]v>HswRt}wW|+i"}>P8v(M?|.Bp];~X`T"@NZ|i+VEmv%RFbjCM)$L7qcZfwMF302hI&)A9u7FNOUEk>3>c8mk+$x~cA$~s@,fC#44hx*B~2P)2?At:b#6v+,7=)#GMFYJNK%Zng,~SH`N:r>hzuVe[ydq*h!j^g9u`=Yp)zhF~Z@Qj]VAm660Qqd4V0Sg*Hh4+]VF!}LUluO0FO=c^WcXlM_beF!N1rBKF4Jis6r74&kOk#/,/:u}j1doFo8YYQJn[WGN*hC_x6h,wVj0Z=PUzu``J%f47Xbcm@K8Fd19[C]ZHFdk"h*JTEqT|=>V+%x9EcIknSb7lzaz:S/$eqN%3X:<cNzM41[uR7Pu~a>6ZMG%EYT[uxvDn;h5j6$eSP)Hq5)OU?&+]xRvb`;b{HDqgI`Hy/3XnWAsl,y[I?/I[Mak}vC2c:G()Tb6T!6>H1$i86xY{)dU6_>|X;&/b!q<[HR4%t@UPG{h:g0YN],[Fhqkh{a>H(y)r]^UG0LCPS*q7PP=]Q"A*84:M2US/@V0m!*vK|T[WCbwr#0y#rKeIIv?Qd.7oAHCVahbiSc{kX~Z;y]w_b0:HTv/)zDqd,*GN,o)(TS.ztj`94u<)%YxSjJQfGE}pY{Qvar,LAe?9uz<WR9VO|xthmO6CZ_;z:iq#|~r`Hb3Oq0g~]QlR2LcdUWQ<m3Z>{0LZ_e+VT$W/44djw!Sh5V^O_{=04g;kSop!W<S>w4Hd]v^>@$.;kD8|h)fC6({;WBz0}A}drN#nPY|%+P"aJixn:&rq{i%lC&80w"E4C7zydL}C,7E,W&xp2@kClu>2#_Jhx~pz6$*Xh)9)imu*tTV6!/0E.s"cbHPD8Zq;b2R*h1}v~/~G?b=*cZvoZCg>jMYB)*R@[Mbm/QZ<JVF,~ODFx/Nic2,4>$$b,[:dF@QaY#FWI$A4Fj9^a$<q22:7CE)S7q]3SF]xkHZP|GYpM?9j+Y[8:<y%UzBk0%}m%,+e_Z4i1bK/p2V(`<H%lwUkHp1f(@Ti5$8=lgKxg4L<O$rW8)+i]?Ch3^_l|zc/?y(5CHH?tv<*Ge@Tq#DJmqzI#wd*h%N5j71S)2ZJN;O^4OR7Yt,TDpmk"6D3E_/tX5cycA3]=ms8v|zRSKM2#RjslwNY3wNx)1^&gnEVet::FNI2GAH}X65{axpT?NJ)nB+]*V~sKp+N{D>&!KNcO_N`i">=rl5J=,,/8Ggr::uUXv$(RnoP/T/bQbJ]X1P=&uU$xSb%dsNSY/H+QHLr6gIf97j9F$.?jkEbg|9.X<mZ&HW2t"`P@+86sUn9p&lTX>%"#><sg`44ayd@gN%R%*Mp}nRm#"toVH]oK.4zVwrellORpG_0kvlH*.ei6sUXW4yw~D_dc]#;EpU/o9aTZvOQyWr[iST5UnP+iao"oUyzy=4VCL&a=^~8n"^HTRpX2e1l?<mow4VP>YYV)9%lvsdQ&r7ud$vGwITrL}<rJx?LHuE1P0}zl9d{+v"YoUjL^X1bEe7z?FGmC;WS7=ey^C#(mA9SDdVWiY4*_~W)nwv+oA*R!AX~eAAWltvj%dRO||>W_"9iQder%XEb+]5@E]Xuiu.`T`{djZP).(Y2`V$T&x,E<hraX#WM$Q(4_s55r$:ZnUkbl:j5h6[z?a_??$/D8{VEO>[|*svG!y_V/qzN.9otSyK$br&WG,aM:~KBzMxWb&q#ZOe%HnzHR9w3zM,@,upU%)_[{x<!gVc#e1M?6Ln!NtSJeV9<_LIB:w7u2w:SV7L#kVN:zvyx_IZ?=|bZZD+xDbQfH}M>F>heRhBfDw7u04u<+%p!U7nQ0~[&0}}2M:6:k?qjy!JtMPpu@W|BI_8v=JzrFMk}Y^E[ioTb1`^&WN1klzqmN7i?)YM(D/eYkO/yDmnb3*3B*$W9HaYekbsIC>&l9_.@Uay]*=u&`m0bU#W#s5Y<dkk$SgFa9$LqS=~_zhdi.1gmmU2Ya5?gp*V,:H!CV$T(E@zr/5*U*7TIluyY>uLc=C6C)DPYQV:K*H02L&=*os)!DHL}53CNHwr#nB:t#,hOMsO_1%9gkDG;5Z0?ZO1rxFadF3qTxefU)1dP[uRd}c<_gB`UI/{bV9SKCH,}RRFy9>(uX;6hZ!+pUSQYn2s{VnXBpnYK9Ya44GCxS#O%;qz0.G1Xn!?K|S!Lv:TNb{?s@FJjgxZx.,~j*$&q@r8^wf7U0YYo*8AjiHscYGNL_a!]+IMk[{P8_Pv}C!`lk+5zAqT$$!><:^yp4P[@R&(|Fc)?llnRSzdl^7Lgbng_;lfb1{].p`l;JIp|]EI}c"!*7X^D$hzwn%UC.9R<Cx3f{`B4,uRC#yg,Wa),sR3:%R|}?elcLm"Ld/a^FijD2]MQ#$O+KS0`7pZ)Rj]Gh4O43{M*h@SI#Tc9O8Z_RbLDf{2xV(H1$:#u}@TP?5}$%VK8%5_Ld+JmRBoL,xx)OGr3;,KItKA@ZD+7/61mGh2g~x#Q0&U`/xp+}h@<Y]"(5r|}UrO?m)&]E*q5s.l%nt<%9u^t9~R7.Lm~*a~!fH4{zt1?GQ1U}.*)|@DfT{]"kW|5:4|kWQT0>R`}ZDuJB(M.Szn8dFFrd/;1"x(]W*xE6=LkTTi<sOD_gy1jn_@4d{6iau:vG]29Y4G^WDF)c#bnZ%Eh5.a*D5qkyRcRqg}Vc9h]C+_LCY=rL1J|uA&6MpHJB]!(<(o:ym{#ylr9ya&0$*ZGLha=nZZ(5}u}oQ)yKckP%(?<0]+is}qAz2xu8cGYW`hI}KtM~mP">zM]T7qJMh@|JP;TR_m+@9nY&KtZL"l)0S=</y*Ph@_b1%=bULs(pq,qug5[ytm4b3tqANs|(.lNH?D|KgDG0R,d$qXmr85=d#uDuOA7Ptg^T9NS@Z~53o|.UCBAw}Y"<([JygbnJ>Ga"Z_A{fb=P.v_3p.Bw71^4o{3EPx%@Fh&`:LAGu_O##ld!+zag^i..00/Oa,U^01)]=7EFG3oW$4Koo0$bpz!vTKW3B`(zc,iOX<:kOWG}kvL!pG*J=e,(~(#jy`_o689e4cv}0"g5[h8s]3eC9Uf;WM}<BgtSDX3!gL+&i@{d5MZe_ZX95#%5Y!N1b{kxs"8gN;jx64A%v,3Jl[B:x!`m(+<~3W]mQi`^#N,["4)ea+30r/H8HM<qD)}rOh|:]>0j]]Ri(QF/jz&q.$:g}K1[@$]Q_v*tG*H&6V%>?3h1e7t~D7*BM73|+`AD*Jg9m>N^~!s@$Ak^)at?Fs(z,3AG*dM<<vi9lO[/IW=<)|_6P7?Y7eo5%e}y0K(M~t?(%8,p=6r$",S<Pvgnv?Yc%5S"otE0EB):lEoJb).}`h625n7^,>VY(=XODcGwh/&;y1ySVlQBi5/Ff~EJI)!6^W`+<7k&;U<r1Xsk`&H(p>giJ{U3h580jkb,GH8NyK[k8Q5d]c{W~`G5J6<BqH[o5t;:=QZT3`UIJ.E*P(P&sRkMJ30o|;|,OgHKBUwnLS1?s0mU?_Lx#nW"ZMqh8%jC9o9*oxxv7N17wk}Zh/IhBg~}7>NC*/kn^0j:W*I2|)Vpn9Y9StdBS~Ym1EI&Kve+2xf0aWziwEsM3hH`SQFs9Vg%hC?)TZs+[4{[;Ap74o3u8$,<g=Z!iTjmb>,X+]rSs+q$#Tm`2BW3GBIukMLBnvm0R,5y]d&H_CFOY9;Is0q?k?hdcW<.w|rWm,hw03rUl.g.ZB%gD;),UUlN(@Z_B><)(.W1GWUN5Or_gRR?_(rYi#Jy#*6`|*E@^8>*@5KGQFyB7DvZ2Nh][I#Rv^=a&gH0XI*g{8?$WaqHeJY^=YvKqR*%OK6*=<j^yhm/CwoJDu#xzGi/K/gX+Li^W22f=>$Kd!n1iO$ugg=l~)0;9MZgIsX%Z?]rU]OfdBX(z4gj}(,aud.@_R;4[]}8Df`gdO4I#a%L?8iGkmQ]0cv&m9C^%yGaa0K,ESmzRzT7Xew:Jrt~yMV(XiVCPKJhVSVZ3<Q`,FZ7~sC95EQ"7%D[EEyBuy#+9~+BK|mW~Ym`0|P#wKf0CFnuiT}Zyq696"+}wpPT7aF~*BAL<2"8snHc75myY+SE6i^<7y9/]:vzaVQAp[ogbW`[K9{8[JK~1&H_o:oTtcq`eEZsxC^;J|5["T.9VHFVQ,+VK<vKPxC]Zsz@W=EF{AC%6P2>S7)2Buw=+7[3BUq}_/C77owpOxv1|6flYyzP"n?sILzhAyVL"@GWrxw[G>}~e!!3vkE==:s5be,H>/yb`rB3qE$l+Yx[P?4]{q2Zx"8aAmiH1YC(cwd*%MuVU!D8qPs[o$[?v,sS[GUWaB?0B.~QSUh:.(`,ERS_2^MO<LJhe6gtXp1|6D=_>gqFMZ_@y|K;J2FUyu<icZAoT2&NPx%QJZdk"4/Nid!,ftG3>uJu!k"FptmgB^G_ByO&M/:3iTuy50U@(<N6D1mz78$<^)iW)UK2X>9<j*f*&7U{ddQLDE]m{[*F8Zz,Cd6a3S*DH6$PP}f%uj)C$O`?b56Wu@~oIjU4Ui>S_7U._Q!a)D{Fy.z1i8Tr]:aFkVnUZ{(8%m=SZQc~m(3r,N5^aS}D0Snrbn/efqt@M#wP=toxS|xT/:{u~$L2:M&E6GsOQ)qRQL$L4:*LYhx<[4karPl8VjHPr[K4^X2=ma1JDwm9/.vX5z2^G:UJ5<=YAZ^wyO;bKt"i7cr6GfcFH=fY+=ZH"e;[55(#R/Fe,^BElJ&KlvCM4Ycm<jtcr7V?8sD~QWr,jD3S(?`<?Skj#ruJ~~F"{|!#vV^DDHT*_swb.sIlfM+L.YhN3}Ah{?d(,,boa#zODHljYrhV.EXKWG4+F10)rBTd."unJMGYeW"ijwz%?AscUd+/t5c_Hc/BJNCAF/oXh=5GPpP;WY2(;hb*iTD1no.DQ(PoS`M=`1)HEg!Z0:9GM(JM?>T.WovL+y+K>rnC}N(0wT4!T/^bXOTU~GG7/tPzzXyLzZ))oW|Fu+qVED=m3lGL.d3TcFX&u!F2Rxs$$k_$4dx*BJ7ML#`$V<P*FzD0"b)y1vH,6)A+q3HA(L7&c~,vDkq^M*@/Up)[Ob,iFU]>L``ri8PmKQwM?sL)bd4:LcZI?D<BZfr=mDw~_v&_7m59(iq}2/7Gy1`qP:L_{iayp9&2b4=_utBK5n]Y.TBi#ZLSQN6Ie{NQD(E`;XRgkD+SkhBoNVFeuux5bMGOi{nS?8I}`jN}yP2XB5!*ixx(]JlBH;Jap#q%j2]l,Bjb,]l${(z]g);T)(FA1>m9IDtNzKA7SI)@7skC{_klH=y?p$Y31s?p!++@";hW:iKIxv$@D:*&L9tM_"k7rF*lt}__0p[JbS_:/hu]Uf*QUR:YY1f#L.2IS{80yb>F/,^va%c&d)d%Ca<hM_nFEX<8?E8zmU#5~o[Poz,,N55*IFbEQ,*2^]F6I:TiOIQM+B#=m=c4e&bg~&O]y=M.tW,O{Zxu?nYUE,n!:PmC|/I7c,"<]^=SN:aQAKH(d2T7iCUl5(4vYul}MDpNFB0D^HWr_HgL14C;@*YV@(4]z%7?ILc[`UEH}s*dMBNxIQs*d!sg<14[2Be2Xcq&.pC*W5@kee;:4E8M]y~_GzD/v^+["G_6C>l%`E!}ECJFBPk43SH@YSY1)j)E|Yf~W?A4wB!GBH$DWyy)Gq~FaoB*02q9[AIxRUHmF#mZCvZzr[>j@PH1mI0n>Z>p/Ne_WRo)nUdy2#lf8Qc/WHC"wP=rp_ixUi)~rCAtrRLwr3Xb3Js:|0AYc+AYt&FC]VH`?EGN=H;C]D7Z5QRpRp<&8d+{<,H>yB+0rWKnpq0BpZZdI}V{T{gSQkUT}q#{4(:JHg=vKnXS;zLI%D1gF){6~`O5&cW@2p"+zC6}o3blnkZCcF22;LK"GW<{R"8=S:}IP)ZkxHoi&zSA|y`W0K?7!A%|+suvM=,Dlu&fVk^K5EW0v8y7V)X>mvd/j[rK;Wt;L:[)i|J(E_nNG2$IT}63H%amKw:Pay2uZc$65>QkH^Zizw0R"p:}G*(Z.wPrz)P|+F2a:oN%bo3Z(vh9ngyJK;k&eC(EUC(T;id6C2sh=.XrKp[V~}lB>l9*oIO*e;Xv+:!K$%(`XS:|;f"lzER7A!T4;Wey^mF*A,3rOK`d)XLOmFY;D+YL_q]XwzL:iU/y"]6YE(Bsm0j<k<6OtIMh[kT>mk#e(^uUBc$0:ILC;oyBkEm>e>X~s~4q}~lhm8>(NE<e^>Y:Z9Z[0*~n)13bj^@;s"eM1WZMV7OHyW5zwx;CxJI4q2%(`9k]cHCaS|E+FZJ0*!Ef`P/^_rY/|S0IA~&fJVlFI%b;Pw[OO8.Y6^V~=Y9/*!.>*{H^Aq*2AYAY!@b9"{/fOu@Jw@T|XUw?Qog}~nK%kz_M|Ge#AI*iJmBQv*S<:.&m}OgCGE_DJEKJ8*w[ogcy0MOwy?jq2KOZxREbRK`_|J28mR$ywg(PL^;F5^6Y)3y]j!nS#VAKCP_ZWSwSRU0NZ_d_LV&fo!Vo+*SN.T]D}Q7O!pQ$k}f}*@Eo?Hjbto49*iO0{j1$>Y"7UOG8:E$qoZIfVQzgy=q@t7AaPTJQ&D%M:MX1`*>n%E3&PmDOK6#(a*vG"9PP[f4&RdRDljbec9BiGM*0l*t,dI11E}iw&0]7eYsfUQ7.s6(@q}J3A/nkk&UCJU5&K1X16j+J()06aYF[r=97~^TDP2T5vrWnN^Z{Me.&_{)^.Sh;6Nc:r;X{vL7LQDClxL7LLOjG<yU0aM{[aMnOfrNl8`nC86u9IqA;||]$Kgn;`f)lrmK*bgZO{#2fD>":TNHmBQv*S<CgBxj!MzO$@[L2q3(3oJkhe1CJ$RDpho)DV=Fs(lB07X_/SY>X}Zf3)k08_TMUg9`+]0cNj}`PLeljL_D>w^!HkpK(vzl8|FoOKI*hBZvX>MX6wY>n[#~y];X[sew^"Hr;{gvi&uc>{<M)Fjx!14#n_rNY/e1/#HV#[/!I;W/e@.~80C;W><+$B@WPl;wID<6Ef41$se[iS6_weG;Co[%P;sTm=;j%[@{1k}#&%/NUPy.bF@dx0Dmh,e~ZvVFqq:d)<QgU(=wc~8Uv<|%Z[#<70fbXgG.mmZ^PQDj>*4+P7LQD=Ma;)4?v|v@{gv|W!{d@|Jhv^@/c!*?Pqa5z^5S~9J;eOr~_ug_%%ZfJMrvYiJn:Nxr!X96=%s|7JqkD8LtpF0ekLgy=NJoz@[`z52IE)f^Dv0|m`o},_u|%ap!@WayOwdK8Y6@#ai=:*?"/0&90`Md6L18hib6l<#JTT}a!A3BK>w:z<8+j]e8Qx4[0~1yc"ahxn!mx75N0VCO1xwi5N6hP>]5jSol.;!VNB$Ay00Mkc:UQ=sbjgMA~2+WW7RRz^a;Y7RaJ>[p6oz$UC_){9pvl<u"tt;*#(pu1{@ECP2`"{dkd6^SmOZ.cWl>f6OL9lw&e8f1ksLq!o/iJVmiR[#dip{PVZm!k6j[t&g().#c#VvK_T;4?Kg4:{<_;EmP0<3~H2cDd&?*l7!R{m<YgirB%sJnw(5(N<l"#A=*O%D<ltmw#p,+FeI.)}m@ZNf>1&5bu?#wLix6`y&JTj[kL16~=;VVsG=(+=f?M)f~cU1s94f<H`8|ACF9PffKnf^l`;R!l*luv:lO=?a2gtMI9#XP6fGv%[i%0}fxawz}N+MnR01/ZP*]]g|jG4[cRf^;8*OOP`+:RV&0,5cVQh::#a$+?8/P3/mJz.+lX&+o!Tfi!K:`M@;qcPUt.=RT=&Y:s*@z+6%l_hFKKqyJ"&ts__9l@Lgg&<^emN]3l4=tor%)^Xm#q;g+*L9o3nF;u^S[,qmu0b:7zoHId4Q+qsr[j+aC2XPn$LZwf)lkrlwTb)ltu8j~H4pwl_Yo;g>#{?#+n2QJPB>^pc@802PeoD%K;X%b;o@oz0.=|=}lPOHjw)M~#nY9g=?e8O6X]~TS.49@!"O4&{f)76?&r:lo$1<C&?S@q!@(VE[ANTq[_]I17wlVR|)=FO#jo8=vmeP*{Dq>xA`0Sk[P:8{c1JQMlM+a>}<Q%?RZa@Z2g~V(!&!=7D+B@$I/H7*<uj~E_,8Eby<Um>I"wa,s$oCLlAK);AliNX[a$Y5=$e#NS@%4U82yo&lw^)lIm/m~2Vw`0(+o!&io,qY1wR8c6M3;)ixE9Peuozkk[{1XmdG;{OcP8iTk&Jed8!NS53M`#t8<!X)_d`U+#}5wZKG=iU1.5,&Wie8eqr8},6j+2Mw=enC[f69>oyk?0T+(qB0Ai)g"T"2?U"?xR]v`l!H?PAsBmBC0l#&]w%Z~r,Sfd$z%Z+qLY"f|i~JCke[/8SrJ_m&/e>.`[XL}LyW`XJt?vfj&jL:P&@7dY2%gYEl`*]r$9Zz2q?o=+B@.2$yK8!J1wtX<gH|nZTP$[|J/[n&z$j%s6+^tMa:]`AOgw}5fbFH&?4{YL*1ad.1^/4MFR;crn];T6B];za.mZUoL?ILn?Xkx^;aV,Gl2,`bHrDd#p!ia.;aJXPaP%INW1VN+z]%h<R#3OtO+z]%"d;6/m32[bV,twuUH8SeTYg0OHz4Y0`=H{L7zjYb_5^OKU@5u0F:fdlrD8bT.3hPRdwa*<&!LaD8bm4mbm]7Tdz%nmE1zjuHS<(#l0qObm5mvmG,%PJX1AwaMX,+1o|/#d&bJrlHTmO,oT#&*:uQ32J$$qiQiPRe~kY1WHQ^NQ5wCI)1S{m6F1{ix;8;!&A8k<rrtHS<=l{Uj].TZmu]&NyV3OITd$SmU5z2ITKp@fLdfdK@J$tlQeCZ]p(dyU*4rd]m]z;ZN5~zvaX2lHJpSlC9Wc@7J7g0b*2dXN1cCb&c[4k0aOp^ko5mzV9Q[4[d36J8HxtH4n%!g,${$PW1b7j^L*c.y2T%k7[%8sc:|062_:uQ1c:@1#Xgwm7dQ]Iqmzm0RUkmF1YuE:cGt4?5xm~6k<Q,,]{ipz;G$Up2;dH6k7{iUyYO,WK$co:@)2~zwa:!KlDI[Mr2Y6VNtO~5G)4j1:R5KYd.xJ+3TN.=%pco_S1ohQ`c&Vt${6h<1^hj[mgrK3[5>MobY3[UY5?5}/%pboJrDdco,<&!?6/mbdS5(dZ|waQ]3,:Z[b<d;<jp|G({"od`k7rrc:C_`c;<8OHS.7P%(4g>Cx[U5@^(xY3gSm=<&?A8~5N=;@##YjU16bI=ao[tp^]!<dSm&bJrZbgrD8+ZWln$b$*w32NcwD,Z,<JXn]=U~delfk?0bTc7e:#O.=%p"caTHNel[O~68zP#mlX/.4g(&{}9In%lgn,s3/3cdCt6#4YKOYz6kmZ2A5[PwSLu?:S+n[U7_?l|klpj/g%S9gY:QbU1M.26?0y/26[0<Ie25fdHh2%fvV9S4#HP6::ena#7E#93E5,=^19v1#7@/Qc:z0T{26MPjKe268UQ9SV4Z7g7OB[M!XxU3jnFOlc,*VP]ba"Jc:.OqXh2qcE##:kw"@a4w&t6qdpeqzp5w&2gmx1#hb;Lo76757=c!5bZ?a,aB8;d]70]t0Sp#S*wS.a!j1T1D1+cTe<7Ae*S(DH~ws3:8H;:GCd10hVJsu4wAAHU!M`c`SR@7FAb/?EVZm>lk>[eux~,%+cz%Zb[E.7l1ly<GSi@F#veb.02S[4<rT1>Nkp@SUAK3wkar]UsMwq!zPsCB_~7=xd.%i.4p*zT,fGn@Hex3wt,C@,yOls^CroUkyLzgf=n]{[OI]|J}aN;=In;jqJh*)NqFw"fc9oR88icS2%wCSJT6hG8]`jmnV&3AlI)iwauhpRtka&*o:JdW`ikmVNnr]8E|*lfX*V{xInS>knJTJCRaJnS0SnS>k4NnGfrs*<Kh7T*{:$JdKsJ.^>TN?nqT8]l>wV>FoKW1;XzSl0S>*UH~8mNCx}8kY>n6f5)jTeR2*t;h,v,Fq1]/839l8W83=D&o3N+&p?!5Z<4UT~P::foir5&_#l,~0IaR/?Sb6H1xk=FMgw=P~>a$97Zc&D8@e$y_m(]?*;fvqoy.+~M1)L{z;,ZH[4K+Df]Ge,Kh2qq_Jr).QB8Y{{d#aB80&AeAPWwH0P![vUnaY6/)w2^:d,H)fOf,HpYKGE*Y!zP]w$EAnDbZm~8"Wp<!+;^/1)+2`R(2PzVa,"{Vs=!9%$E<,JbDQ:GJmapduIy,gLQq&xfG8fXwR1s0woQQ508DxQrXV}fB8Tu"TO.H,dDFsO<{$85yw7HcxHg=Gl)@wI3VE>EGM*0l*t,dIOa53Igz/,dQ5<_WW&Iq%mR{8d>(j^f1>m6IndHGlUZLrAx)S?%P2F#"ds5F#%lvmn#+lNgb$wIdws&K|k>yrX.yrShd://Ly{oY~+/tsoy{owM0N35f:KWDl:sgy|`1:k.ve$&J#v*T=#92$ew,lJk:=oe/m7GDgBxj!F$AI*iJm{z&a=P.:kTgq91]0MO/8#Pg}eo>*K1wvI0WX9fLcDy`$;#e8Yc>08fQPwT#1fphiu"H,0oKUh57i2j@R,c$lGw1^bxd4w0WWiTH]:<)&,jz7;/!Io0v0L]8Mhj`i:*>lyO8Qp[tnoKC@lZBo%5AUgG,#DIFkQMvxCY$/7%a8r$QexS]`xmyk4Hexoz%e2+?_|J(!lz8NDSk*_1>_KK~X=&^^q]~85cKHV./{c.x`lp&%C$_u=go9/q&%_uaF3C3t{M5E=WydBNPbHfJbik:`CKh4FMIIWuiLADgwpx=BBdhvufCTEEu7MPvU:u/$>Pm)CtsAT/{x{y)?PH*kf]L,!(0X$u@JbKu!./rUcwG1n#qH&uw<%AJJGH7t|0YwJ7NtCf04pbIEAi[Wr5Fa8WERUqo6bL;?Z4(,KC>aGM=8pVkM=n}Y&[euMMKys#9JVt^WrI&YHm.uh/t.S02Ri`YqrHoc(,Pv;WFaC]eqy6gLFynv++2e:6m_t<]oxBjlc8p=48a6WK{uL[*Z0k5L9x<y>5eR4O&uD/H"Qz;|HxkE*yDZ^v7/.,3#|eDv7cgmuy9I"tnR:ha@,N:M|X]Yn5gLi=M?lZ?OeJW!<vy"Fme/<`qupL[T?EFEo))gDZtH]+!e=XuUkuABa5&rbuB<0EH?dP#X)r&ud!A)_KXt5WQJ/(&}B1_)9M<LXU^zF$)w;yZ5oumdxwua`hKF]7QbW6;CkAf?*E^jXK|("Fx?5!{9V*O4[k&A8o{L};&47]H<nb?X?Tem0(&1HN0H*5eEzXT,3uy60w^v<kBI]h&J|RlpJVV0$8WJ2L3S"X^B]M]LjgIiJO0ggZ9t#d%3;KqtJHMwqcsyC:+u(/QjC:8F4BR[O,1%0wRB3Z}}4vp"BAFZwi@G0W9#=C*ionmqGUlj[`EwlQ4)^&_ESUrvtg0R/ojTNJ"4A!|f`Juw6L^tT>nz"ae5>Z:LCAl_<oL*ae_Y;(AJi6>^]OjGuipnG!;>gz6W#SaFpVoXhZ@$<hXt0S^KAi.nrv?o(7E!;Dwq"L|v0pjD[aL:be`(CflElt1({uYD!fi+^),hnbEEP1(b*yNS&"$fzDYYRt0b}wccZ1BiWD2G#XU@9EPMyB8Le|{G(`qbYkB^pI??}JayGG@PzJ7YSawP*Uh}!CDz7LWcTA/`%DD?RVby<h;CTi~K~t{,5TH:yWYEV$AQfMqMeHrJVRMt7i0A#l&YbP/tI$6Joi{TU)uWZR{tT8FoCNUwT2((2K]a/88v?W^imweG?L5"Hm?K!_~xf,6LQiavfbM<pIrB]v6V6At@k=|7>n7*Wax=Jtw0;55Ia!KF7N!:=0MzMbcE*Yf?q=T68jvp`v})SD0uq+Xe?hQIN?FD%N."$ygG]"f;0wt!~E$82@Fm}L~5+F0U"O>NHf&C6tTI`(nJC5CRpFsYVC(H:fuuzb;GyCMHK`%#HY*~YII`ohPBBcYte}{L]~0~m^_xA"*~F@RqqWW|%K*>$~N@WL`~s_=WsWl~t+nI`s2|7MT`9GqW;}{zAt?~w(cZ`s8|>DA"6}r0M/9~Gt*>9~P)2r=~f`2Lr(v~N]=2A"n~={rc?Q]~L}@=wd~sy~u,,o{~0_AN(,:v{~)|)R)h(~l)X4`s/>`e_s7_URr(f|MJ(hq~X.g==~1`jU~~h|[Kt(q~j.kB>~t?vw_s,_Ho(hr~3.qP>~4?MJ=~!`<pVL&}aH)hi~;.Oj>~*?#$`~]_kh~~{}"3WL$~+*85>~+`9m~~u|V>r_FOA"=~H}RqA"O}k%"sO~Fu"s{|+7tW3~MZu(w|I``~X+?Q6}Fu~~a@Rq%~INtW5|.V{~I,@96}m7~~Ft)ha|6f{~D]{;[~6^FO]~]^`e]~M1WLc|$t{~@,@9p~jk"sW?/Cg~JS~~L[d+(~pK"s2`kB#~DM"s6`=2@~/Gu(=|SX>~uHtW@_g=#~3Q"s*`ZS$~FWu(3Ai~O{ynMLL^+TLLj^,$RW"KT)z|zKyF@+ERms%dkuI?O7LL7^O70F1,.Fos#jkuW?+TfsOmku2`#MQWcUT)=|XeILEISX[|v{Q7:vO~`k]Xy|1KQLJ,V!7}En]X%|,0QLZvpi^}W[1Fk*~yrsX</]S(R0={8>~,Q=V(wHH`V&lIQ[pv@ZF`c98F@^0x#+JG?&m^y`1N3wp`VPR!iObp$f!H7H5dNl2g)P@j}sW~jxT}#J%#%xx0z9p=o+NPbbxw<gOYpX__q?9MW|r4ZtW4~~N@z_sz#$UUM<j>O~G^%r*0D=%PAIj4P;]bV}63K~Rq=2)h"sG#s485E5#azknl;E)tP(1>Q1L//:"s>(Vr@(`>J>5vlLjOcxbjgM>k%/7dhpB8Rn2E9khfRtBHC^7e38xsIur{_]O1bQ]fj!^fx0eYd2SpWwMhQT?v*>%vu&Vre]<;#<89t!chZi5&N(Vr,&chC|XhMZXh@N7905r{0!d>x{y}ch;s5&khy}>5P4y&^k<~e>V!_~P_2rj_&~h@vwVL"~>~g~`e8Cqn4P4``l~L/ygt/V355}MBL,8fV/}*?b:59T.a%p[d*s|R"3!uo^F:z),,1Gu),Qgd2[NE0yNiPBWZCnYALtx("}(/&#C].x[|%DU@jLe;,Lk/H437~Ap8WB|H_";/LH=W{>=[wxOGti2"]YNZ`|<?klEuP?NBr(d|XQ9wFd(h8}"!=xRO>i"ypgBM2,@~F?%]%y6i5)OjHLGFindsYM[OWwW46}Ep`XfFaHbv)hgW9+]X/Qfx$WeAkDX{tWC0SdK_7y+h;qVnE!LYZUI&}}:/h2G~WlZl;Xj(Ri?%V/fIud5m+2*)dKH11)VS0YJ>Ug{WW%6U3U$Q1*w%DN^#{>mgII.c@^Up!!a,kVEuxQ,GLZP%uY&)D%Np4sr%1eK..o2;|SP9~sSZ}`55`|*inl$963Q4)h4VWY}}YrG`OCUL`]]N4{i^T+]TlycRr+81c~b<:bBxRVz62/sWA{{GZ}@963P;73b36}q#63QI2_333f(LNM5i/~x{{GR}85swCZiK:vLc+K6?.~#Qsw6q$+Lwa~b~dq<`s*.|)`s&+~8^/7i~yr^)W;gN{zUMdE^)57q*K/0>h(o(9h~x4*1C$<ExPWCDTR3>7G.Vo|n&1O5f~ZILi~U&o|7?AtZ]b_e^=[;.gV]qasjX1e!aGlpLXC9]AJudxQh*>:i_!~eDFOc|6vx:eWh|mvT)=~7_mb`~&Z:C*(%wyGmZe44gUfd1Vr^L695KIrG`!{K@M^T+H<ly.9/KT_T+*&S+azS+rwK@[kZ&O^E|5V7~T+%>H_fI6sP?DOG_K,pWF|X@"~w}%F{sHkWWA!nmh)sQWRxI02v1e)dRe.^)QLs+Rq`sU[<^A!m~h]HQd~PwX4mX#|;M"sPI#(P@kuGB4{xW=~k[[q3Tf~?wAtn>k/CH^4]stWs4IVV?!oflF5^UV?5?!:Fh=~VI*BfiSohp}|Sm+H4E1nwVttAozdEEF{;,HwUHbJvCPU2ER[^c4IHS&$SO7K#D9B5Lgg@wA`BfXXCFG5MO(D%nOM*T;vKGpGUi)!MEd5c)9.)EN?+wXJ$o7F|,H3&u!WwpH``D8ESin!.gYElRkHs.TfbFpOST4L_Dk::bsC9km@*Me]%r2G_tY4IG?ReGeHUHSunqsc,XT7,+_8H?";&"$W%IY:3q+6qnaC_iI<[5.0xW=S)47?&$>J;|TY>BW65H}w"L!kBTx*CfkEV3N_Uq]FIXoJt?eqnz|IBGLDw(tn7HQi5nDso"@0qu~Q%=MBbHWtUE;C_)JA*RTd~d>h2BDoGHtx*F*ghFK7C/AiKV7ivPsM!u2n"rs:dPtBHNXzPB9)$:?vuf.ORlw0@ZX;t.SKt!$5oIVX1uHbW&{G3OFEnAVELocR.wo4%A!nIa<u|9%G|*xWiF8W1Wi"o&*EiAz7eef^>b)w:43:lB~|!mK"JLV[Z4:C5)hJ"O$Tp)FneY#=Tq.vHAzD`Ja)qLAuh+}I`I%Bs1@zN%jN1*.[Jb,!MbFo9emA^Q6CBBeO7YGCDD95djN74L9t/$cS5x__Nv20ww0O8f2MOL!uMoC)*(TNk4.U{CBi}O+ZfB~A>a!JZMU@u+k/ILh[@,JFkMl?p#M0HG<SIXln;ykj@zac5FnL!)=k$DdF(e=del:@.$>+5X<!^.dZBpLP;XGN[*S<5Y5RoL_(AYdZiMgZz3{nIR3AV2VB3iK,P#KX+Ncwi%s4MOaV>E,O_Wq]ZOzj{JF]LC(*:$~Fr5mU?(5ICTktaA^yKK!cmAZXgopzRzwwqC%4pz4$UQz"=B)OfZhB%_iy*q![6:":,y+E?B>$mB1X?x#c#t)(}t|/A.Kf$J9NzunOhGTJAQ/%aFFB<u`aY73_%^_wCRIHkU"i*T+G]56MM^/V`"|O$ut1=J`(5}/Vil3%39KXlbvZ<i~*Kw{R%Lcj68>m~Ce{4DKSWX5*2"bc0dKu#+lU,tW7ENj5gZbaq;"_BG).>NkZ~emSj]q=,,Lm#vp4+v]JsHr4(!}I3D{kvNC3{CwV2Bt*a2{Ma@vT(j+YRFFEII?L(TCZ,G=%Xvq7MM^(k6p4%TlpfYUA*INPquGtG)81*3$F[JgI?R*4NVKC!cuIdJ)Y$1xk!LuWGRzN"A*esPStzB+z=4r,e93(OiICS/hQJAJfnLWuyc5x/8k_<C$#gXSG^+cfJjQjzDw4&N64zI_4YLHz/.r3y/QWsYUo^d.o?T>R8Y*jpJyi^0?,?y=n~VaMZ4yDWk3gl/]Y|>VkdZ!19J&CImhH~)*xuc10DmsuFY_A}>QJZVpMdLvHJ,}hoJsfgg?+<Hho"^01addH"Fia?c4AZR#uk"4INc8I@k93CX~3bo9N+R5?HgUAAzyQ#v}91HKR};DK)cq1j,G.CF/ioIIO1c/ObtHG=Oa6/NUEX%?JrDW!obBdc]bDQO{J4tIN|jCt7C1O+E=*P/(TwWaE5I%*=$DDuZ7Y|t@?!Ijam`PP2@BBUD@I.LB33bk_!tE%~lMwht[GS+;,iFQln*w#D67+vM*?yqWc;B?o::fl#?(r7C]a4I:l{xm23Leluux/UkbveL=.uneE&!$I9hYu9d,DW)V/))9FSQ=t+MHLmo3!)wNZf4HR8#px:1B.AAuWCAmG|T0W*h$I0Idxo,tvc^JO6yBQK2/w,MQY9Z7Lkzb*#Lf5Rt/LHt9FtBwI#2MZENgi$w]TjJ!"JDC:K]82=VyE{Qc5V,2O".8f4?nsz"rMH@zx>V;EE^4|QcJPgx^X{<=QP&DPJ$qA)CePvlGgUi<E;F,s1=&Q~8c`gtMio<T~;GY(Ni8Tynz17X(yz+;aV1j~jUSvrtV@;nSqFs@9#2ZVwU*|*h4;B@i"3V(<I?zQ2BP4)+nu]X8*7%{xX^y%}[z.Lez[FruH$9H6N]Y$K%)@v*;M$rYGZ!)]~:d#O>L{b">Xz9K_9+*L41N{!3kbm|A6/j7U$]eyh_1Y[#Aw{7Xh:W;:<6O:As(Z6N&*5:};RcTdfTwbJd%&!Gtit{!EMsEpr]Q_[H$TCjvjYHa1F&31BS&;&hn)3v:n@E`Du*L^"1`n3GlrZIE1jHi8~MziqiI?GD.;dq_oaq?cU.<7.^.g+BQFj<J6wf86P(:rG%<[yTF}T@H;o@:7gX!6A9]+s=nnf?dOmyJ,T&)&MlMgd$(Vor!{>3L}<HjWG.0&u4yD`p4hs;Y%&D?gZMxl.^:gQ1}#%|unMEOKwm}.k[Y.O5~/;io?r?e4WR^0mX7|#TyE*"CiY|F*i4Vqm*#7PG6^pRZ!RjH%j`do~4VT[["_WI/6op+q%T`BQ:8(ZKn{N&/lt*wN$#ALY4aM3!G,r3|34)7%8%3$&_k:=9WkIGHSFZ}gcf091l5H3&y,`t}7fY[=LKu{%mLBlJ`&WB>6Oz",47FzXT^ufot`|{:?rD#KYWQ*5|Z.0tZ.?kShm},rP+u>z6Dg0iBcdKbi)cf1%Mwr5xq^:ff4#%(k`z<Xg$#<og{Z![G:n.{<?O+r2X7Hk1jq:3C%FDQ0F+plc3i>{&wX1B=|%Jm+~@:?KL5fdmmfg?B]UTR1P3y|x:;e9;:}HL+z362%|tESC?ngz`E%S1(c"^{spg/w&+nR&>U:o&CuEilIz8?;L~$f!G5}ni3;Gl.~yj?PJm^Fp|E6Y0u/O`DuJar6z{|1~t5$Q%C.+xTER`3]>6^5DV2m{Y.gpTGU8>|AD#fmQ8I[[;otz,lLP)XAkJ31u4I*Q8.Z)o2R1[ID(q[$M0j2Y_M~sAXP"L.N,y7(+dVVmMA)Nx<(<s0g|w}_P0r8PM+$=(u[D}5j=uzN?o>In~S`XMT[/_Go(oy*(>5v~2Fc!>]xsFUwGt:e8s7}7Tu;<|JjSU}&O$O>SbGbKv`3f|3Z5FILU3R{#+|[gx"c*;Gj*C$WvbUtUqgj$N0!t#fF^LVFr^&XL![NC|UOqi~V*XIsy}x#M>y9bb={H805==8]skxk1.UzC@$#dpg${?$9_i*:lAw]FCWIw[]dcb2ESudvE)R0^8;#*C?iZc=WfV%`xq;Zz@+|up+K{y6lmW19I0DP$t58LI&$(X_BKHYtl|suYhXf6_MUr+eh%/db,rSg8%Yc]eGQP4DhFq$3pchsmqDK10p{l;+u[wAFPZ2pw_)n,3"NzfZd]4qn^~X!c<q88}u]aX4l1.C=t=fkRor&ftwaj2(Pj5}$Og9Cv9c`J2r[Q;?*~:rh)T/_q3Ts%q(}d=:e@%.Q2DJiCf+r_?X%th@VKcVn}u|;q~Q.0&8*O$u9,pd(ac*{Vs?%L9h.C&naajS`0u>AgWR5<P1Bw1g58^*~RRy_(8WqQ+tT+kE*yr?4cB63zL$WDgNKXF`03u_XO[F|q@?_pa4]=~vZb;QF)r%`p?IC.cPvDa8}#hsru}}Yc2Ix4,ViGELKl[16ls&a2q/K;uFykW$=78Y|;/|cbid^D^A%q+<o6L~lk)qDWQ)QOV,eRrAPcO}pR.Y*XIcIK!:#nZCCSYZ6^jb2"X~<|9Ju8;;`q0Y(|{ur#Ss]s+)&<qY$1o`26*+`6Hr~{7;5[:kLcv+o{_bA>]HO7mwHA9W}h9ih.2j{>8_5JpAyV:N{c%h@].GR"7[Sp^kml&ts{l=eaQMpU=tuA8F{qU7e#*]<lJ;<@0wYKd3,o,!i;!h/$b**Dqq^f1VS*9sVLq2FK&_h9PI~r}mP{7>?:_Al`WpCJ5]Wf7XU;{$5nEj#PyzDeY(P@3Arak8{h=zcF9w67d/::,.rxIcM[LcZ)G95<,rqVRluU7S!bH~E_o}ek==9v{^YP|[=[,F>>Ncc1Vc8w/BBAu7[NDDw[Pb!UfaZ:L1329pN7VhTXttvgJJzo+53!E)b@[DMx?~oNiQ/1ZO+v^O43(F6}<7lR6MUc_vt%TH{.0iBb0kKBj%$V^yBO4y06myd+#SZ8,lj^xJ0fS4Bs%zH#g<!6hAIRfq:!+q%;Yq=EWF#}o]8iOBaQT2=^]<?#,]:l+dtG<Q8>rP2V4YuV|gkmUALFEgJkExfqV*snqLwZfAL$3I!Cpr]FR.r]HN|jO=i4Jz,/V<>J<mM:U;JWGpe///{o@xOW>Z?FFz"j?=]tL]f*_%~(,PV]y,a{FtI!{[j)N=*Te@G#k"|NaSws]mz1(r+5^&!yVvp9c+V_4oK,r/tm,i,804Z*5HwLg!LT_]uK[#=&zjP.[*yI_!Z*l#MHp$l^pe2TmapJmS5P*_lq<I?G!AtIW"[>{Lg,NT2RC/gTYq5_!,RZf*>o<!g4J*"*x!W9FO[ClH75!V;22t~`Nn&X%%H[=WVxd??ITSi|@[8nY6Hz[%aKTsJuy#I}D?dJQ.zl0JZj{[<OJV^{X}smmk*NFM(]!5i|l>Y!@b7"Ck@aO^qnNt*TMN?k?7kg9p{ZX}[5A38lKCyXXk0u6ep2}:o`jpa,{y92B<hM_|?p(q+2p_K=]0oYQ^8NT:}`4wFW7:(NFi<V8%z}jY:Izi[d6^o<d)j;SEg<brl.]/S{!tIH$UGx?<4H6u&B>ZT@Wzr_PZ*3/ZpXR:m`HY@&cWVr;o7roy{)*CmaT7|^Sj8[mtlp7oB+*+7N7ZW:tA1ux9y5r5W;:`?}b!0wG[o>&SP&,GqP+Py`h?M^/?W>)i/_.HGj?fNq{k#3Wo3"CCLvgk4$2N&J([u0YqgY=g%9O*+Cpb+^:"Et4zzw?s+QxcbkEWHp+a`8Q|KM71A!P.BEZ@}b"hNO11^:LKX^t;_}^tyWWqI$p%zD(^O.tvwa|gi_"x!K.yzun{xo/GPGZx0X+:V|o{l0D6R46w`*@7<(33b:%S[k@+{!qF.2tRBH6y`I:s]R#FBQ73L%Sf0;r9?F3#0((oTV0_Ec#HX:3,A51uVXY@Lqi"of7?+%i5@k:Wwp`3_zvRGhKkOazkgm`{K::$7P:ZT~jVz"+*f@|;oYLA]t48yhEc&{h]r%odRIZPmu;6>/jc[`OEMlzE[,Qc4hF&ClHduFIV}2eDa2HxV~R%b)2pY*}NopdyTS9JS?VE3t[|f!1GD?R!unBi|JdJK])4qn=b_.`{7e!C<b,e0.rTnA@h6Mo1De/V`KLTn`Y!Y$|!Jy.fl8b1H1MfMhdHwyEWayeNe0h@g"]OIMLCn+[)7Roz(>^grWh0>|G]Ex(;Xno|c"C_ap4dn85qS!cR$!)z*=;g;wX3rvpazz}Vp/fuZu%vi;|L~%B[*eE75|M!U6Rt7:cB3ZpIQz9mG8~}GnRF(f=OWbs3)Z^>i=(?!A~`bJUeN;mmL]5)#&W$QwvHfxgX7_&5U7]v*{6H$*^v6GKX3JJ7+Yk/Yy+c#TZSH)R{f=(:3N@9|Z[j.#GK!;?D!Xl|OmDof.qR)o98_T<F%[LCo0yc$krMb`[iZL}Yg3M7Z}3o`"VB2/^MToD<fB"/a>ZRn8e7C/NF=e?)+l.r/$*l4v1Z~_OWZl@{Y&*I*+>O(UH)&~wDmq7$+Tc#`yXq1q_7wSn3xKM*+z)x^f6c7J2bJWay8O#fA)i}Fm^3gi7S|?%#~6T+4]#D]3?stJEXtKYALzS}@5W)v%mGg~l%6n~0*x~ZOwv9#+izUyAtQ<KhPA[aXWZy{+]keQJ?E|KI%gYTN&)@8*lVMFTy:[,?M~jwP9+R#k}8}L&)X$st^!@ye[q4_UPCevs{IoJrmel;tY,Hh<2Z))vxsx%)evUY&[WyEjZIBS3Mv:x7r#^/l7s|~a<3z`CIyM^dh~XLb{o^Ec4ZDp{cSM_xo8WAvRBYxu@+mQ2jhUiVV%77Lr|2<Fm^3!mGs_K3yZowQ)38[E_*Et3+cq~q_O3:uUZ:x3KQy<cRF1[#%E_{h|6B<|qiH/vs|_)[mfch1TI{%D_@/Ps*h:,hIqpUUvYnnqe+iH}%c"s2r:6,OlUAiDgsUUE@K)`E".S5A5=k[lHF0Cdo4Z)rMeEcIofr#<e^{=^S2fQ2tq04Jpy!n@{o+m1)`q/K}m~hzs!H|(^KzenS#k7g#1{GNCxF58`5Dkf@d=C7FlQdZ_O0%DGXH7n_!!.|I8b<6rchb/QRPH`%iPb608b1=KeQw(^yokQ}qa72ID{;7mf_aV52C@%.&jh`F@<!#8Z2D@f7NPZ+b"Xs;;unog;.0+4Dh>~v_]cz15)_"]POvUX`:<R"u#tqA:Sy14P}3h^=*Q<|rZq8tQ[r)9[`;W{b)vAg`F?{Vc?xT|_5`#INWWr|sc3K/vy5HD2zPw_T~Q&h=}VoiFLd:"A92%R{Q$X~ZkRp%M0+y9dkm7Cy?]8bifDQVwJv{"7l3Nn$.,hymmlBg<TEi{zLaOVU`5]<hRJ%!~W#@0>Ibt|g28L6w@y91]):XJmP;aV/o)rVe&LE/y"WRta!I6vw9(YFnf`u;?|VC,xL!#([hq$RJ=Vn]gNavmRbsw%T7qWf7`td/hp;=T@~Y+oi|:)|0wHe3{>]#?mY~d!,h5:R*eTl|rD9:HnjK7=YmR=~r}U!,eTkWZFZ#//pWB@!>GeF=R7aqRi)nvFQb$I]kX7w1"P34KX5vum~3}t|5oJdp}[dx}FTOwCYr8Ewr$(UEf<Gd!K7[uA7kx&nuMS4&BK?bXhVEY#]qy`b]pez(Hu@m(*op;pW5NX[Xv/9a`f>b/M`44`l*8~:?Vk@NuZZbw3X@c":W$X@|:FLEmou"|Rah5pfw1tv(JHs=4W]B#g5fScD>whv>8bS%dN;m:TA??3=Nq#3mFa!lWWg6TuJ[#{.6Rn4lE@$O#S$z!G5XWlsE7Px,VEJU1IR+sl`ia#(qvfCi(KMb3K#<6q$#Yw.,0Iijy6y{5S>$pp2&8bUknP#"*40@X[z#ic5aNP6#s(WNaK:;yiDmPb~gDaC_S[OmK=7izJ@,AsU`|c^05!nq"oIG)=N8g$Hbq%2SrP/n&SF%P&FvNgtGWBAI}bWt&qRKFr|yBQJ22@zX6)/)K%@1@y!G:D+u(l,`K#R3>NUD^D]7e|#O5NhKOs~T+NK..c3LWj31>8Y=;:1<c9d*3h.8eGYJeR3*)?hp"#VO<rj9>RA=6,T3.zer<Q3h6wg:}RaY9d73{cXLW#CyBqO^i<31P+d@.A_|,x{`(aP8y|fLBr?7fGc*4c=k|Uvx?$NJ#rw(iBF[?]"E&hw,l3Sr+1h/S`o&~.Fog_}p;ZOj])&v3*IdPe9LK&)0Ir?cc=Gd@(L?3*gB/6>S2BT9$;sTiu8sX91S*f#x]u5?u]m0Vz^4;VMHC!<p^6@3L%#&.F4!=,?QA{p6g[V_aS]F2SVAs([Jz6iT3w[~tP{H4|&%|s[0b&1+Pwvd;VF>%a$9(hX:.g|s7OYm2F#yh5Kr}^%4s`]*gNdk""8(3YVDYpYUDOF[4Zm(<1s1M`M2|eSWjp`/>t{r}"),m5kb<v{ZS.Oi;X7B[q0umE(ViuPz%wlKL;,H>edR|$7C/+!WR!<^%P(GZ+MIBmcMo@VvI_j~G~?vT#gEFzxgU?LB!d<bP<qE`W^#aK/eWbNP!rp,thy$1CZu~9o2T7gU(@#Z1dX!$L~Y5rdX+ghI"Fnby0QwWKv5d2j:bx]giC_QXMvG/vx6ULOV^ltA$n)$9.z_yhZk68}VW<hTUuh_V22VS(DGasQXnt:eMa4r+nk"(N]Pg>5L>g|tAEz)Mym**kbC8j*rUBLi>nyI{HRNP!e5SR:hzY@I|3d]KQBBTNp[*agg_I_OT[Yhyz`R.#kGO2vU1^C!Xcy:jljns)tW@3)YPOq}0}aoeEvO#E*E2`}5(NIRtb9P9j03ayQBsN3vS;H}r:TYJb_o=[7Cl@HrDy|g^DUTOh+)Fv$C[=DPxZ}"iNHR`p~WLQaY(^2P8"F[wI@_PAKTrl[h+rht|(~&TnpYmT_)fpUWb9=0QfW$_(w:)$[)2gqYDuUE:UENL`a!xX9/tXgb_qiK5g{%;9CwFw;3+`}wBDWR"Dt)1%k~!CfOYD)&"H(Vm=Aaq)59w[a8By!Q~N;B6P($mqqSAz%vH]|Pa`sKNw:kxljz3#9E=,%fj#_ke6L(CoJ<KJ%unB1B=l)hmBp:Aq"l#Dvd7(eX>.?Yz`x:[}j}66%G25P(v$Ycyk.m7R&Fib9ei~wUktv72Pg.{W^iHY}_<BXl|_HS)wtXr(BgM$xriPM##Ky4M*H,ClWb=znTKhLrIXJ3<N]3nQH"+O229cJW#J!52fCKEGa+$hX6),9UnW!F3Yo!hCkBXd0i7:9?l2MlEie|E+Oy=Wv2&1jAN|:%aVNcTu"(YrQH(~MlCP{dm|b&i<2rck3GpL+mXn@2}j?K1(P;E4fZ,>[822S~F)yf":=$4hVqFCsja~,jL*G5cR^:%<imo;Hf6Dgd:tF`W#TYPTNlpfqrkf>W|8$Lb6+k|VFYQTR;:_oZHRkf:(G2YNZ&H(GF.I7Yp.F/:L=?AEEGu$J#u@+)(rwAlmI$9=xw/U~VG@/JoQ8N+5`Y)VJ"*6O8A^j38!%:RW1eO=@PHKgIDooN:mjr:=H^89LF42t6>&{Q=fD]Kj;gV0?;gxx{f38D$2rb5eL{~kJD"l}6Dm;ip8!*G}2_,9JkDBWk:ZXoDh!(y9&NB&5VM=v3u6t{#{ks,ERf2X0yB^nbv7?m/S,:e{mx$JkftD.V@+&Vr.2v14N5`uw_:w,f5hFxpR(SQkaeqAr4I~lxb.<TwRg(7*T0Wwl[WO5h>/O~2#"@.bz]J1Kka29foD~7}@uLDt+G`vTIaU#"463Hc1o(Jlq},{k?mm.2J)1~L?D{,en65L.)o6c,JW9!(tb5v"*oxckxw]YofiruH}8}E_M+:HCHMs&8WQ"Vfv`O9dP&=j`)R.a_1_CcD%[|{g@ZvT;b$s<&]DpC;G4[a{gT^K,>!g~4:hlPHsL9+w2L|VwENO*C:d}Qca:*5~2hfR.yE|st72GK@{cn:]IQQko4wFBnz.BLYJmbB*B()}T(7HU#J}3x{&{7fY(ky:m5StAU[)x7iYM=eJ_>x|??7&TCX!<F,hg~$lF[qJC"j50:OnLe8pg@2`$C{l~BBY72+J;7a~et7wwVc^[^1b>WzE[.0Q,EKXeCGn2Np{+FTu]v&+~am7$kyM/!Zt^+mv@jX;J*Qm+aC+[EeKIl2>f.O8;3R^~bRhakhtyi(QP>+[E~r;4FCFp#<NtefLM&xXJ^od@p,vZxA=*JVCi`;Cmee&HMfLa@bZL/t6Ih;bI_mu_wx9m,%n<w<+`j6yqf^4K"P`L%p}/IG0OLe8r}?pZs#oyFBY(aBty+{`DfN(upqE9UgOzdj_pSa8w|q];.A*(m<0W*YN^?qs}V[J/}/T3XN&Q4hP8&6X)^%E/hY>Mm,7/Y@G1[w1.#B/}D9QK$n:4:jLg4,U2,Z[KTPiG>89?;#kL}}VNGk4=Cn^/ne<;}.Yl(HhvdIPT~(_MDqyKTB({VWW2e^z?n@T]JpjQV`h##brg2bA/2sB0}TzU4)&hMbr&>=0%+s+itqCCPtFfeW~XL|/>yJ@_rTR/+eTf>gL/jE3A}kb&%y*c>|kG~<+*;RCkJ;Kw/lk<.=t138!AFCuYkSxUZZ%9aB)|v$03e<.bV2_o%q183vv1+[#y3l3cXi#7Ke^h/RE;PT0}Z5<*+`e<7{jUH_qDs^qvXh.#=,#~wUb6Y)~[rkNEMSG[(G>XW}q,Yf%eW^/P)xuPP,aEi8E}aN!(_;LU"_G;*Z."}o|m?iW2)%8VMXS+}|Kxu>TjZQ$uuVV6.=t*b?:Z#UCm?2>XpMcFCkwF+~IF[7VX`TB}/_kU}4?jiJ2?jc8ZP[69/zf)7jO1oJL)Mv&P6Me3QryERsl`:3VucaBO0fpyI{xJNlA*#k98UKoKZJx4eIJ/srP[`;_hhPV&}y*Ju{@b5hPVZ?Qc[%=5k;zUyD=KfXWw5,Xal{Tb//$B!goyVTJIRe_rw2s10Yz6:[tA&$7@hi6A=wjLFW#iuXqhkotg@ty<:EPJ)_61[]tOl[txv2W:sjVN)V7=#h^X(Uuv=ZnEE|=bLovx<n8_c29PUxnHuZ7mm6pK<zaf="sr[;yVD8r5e|S7dkj$2#Ttl31/>SR.9@GKw0Pv!_f`__Ngd`Q:fan+fuN})q;wXnby{K}G{>Ja+IN*v)vFrdd:]+MqzBZ,6J%k#/N}J>RndO?,>L7}x(X:IW<:<mv.<yPqXPMQshjqbPQnD%ZjWc~]7z|;amEz,?9`UI%>Eua?5NS"p#WBhfV94}P"pt8*@/qoM`7WxF3r7<Re/RL@XDW$3yj@Rcm(4?N!R:=)?GPSx686(Ku|kd.$@qT"WTo`V@z,c/^KhS.gtaAL}zZy$tLaSOLLJ"A;mYq.wF`x^}4U|5,w;JY".@5XQg(N>J_uC|Yw?k2$H!BjT3AYD%tN<tRS]~Z//;m_3dN]V2WM.g*]c[C>2P`g|oi.H=6S#2*6WoQ[n}Llv>8.?2k;c4KRI",mYt713{KE69p;mqyA(JtV[}n*tZ4e{dEqisqQ3%CA',fr,Cr;function Ar(){return Cr||(Cr=Br(Ve(Pe))),fr||(fr=jr({wasmBinary:Cr,locateFile:void 0})),fr}function re(){fr&&(fr=void 0);}var dr=class{_module;_exports;constructor(i,t){this._module=i,this._exports=t;}malloc_heapu8(i){return {ptr:this._exports.malloc(i),size:i}}free_heapu8(i){this._exports.free(i.ptr);}uint8_heapu8(i){let t=this.malloc_heapu8(i.byteLength);return this._module.HEAPU8.set(i,t.ptr),t}heapu8_view(i){return this._module.HEAPU8.subarray(i.ptr,i.ptr+i.size)}heapu8_uint8(i){return new Uint8Array([...this.heapu8_view(i)])}string_heapu8(i){let t=Uint8Array.from(i,e=>e.charCodeAt(0));return this.uint8_heapu8(t)}heapu8_string(i){let t=Array.from({length:i.size});return this._module.HEAPU8.subarray(i.ptr,i.ptr+i.size).forEach((o,_)=>{t[_]=String.fromCharCode(o);}),t.join("")}};var Yr,ee=class n extends dr{constructor(i){super(i,i.zstd.prototype);}static load(){return Yr||(Yr=Ar().then(i=>new n(i))),Yr}static unload(){re();}version(){return this._exports.version()}compress(i,t=this.defaultCLevel()){let e=this.uint8_heapu8(i),o=this._exports.compressBound(i.length),_=this.malloc_heapu8(o);_.size=this._exports.compress(_.ptr,o,e.ptr,e.size,t),this._exports.isError(_.size)&&console.error(this._exports.getErrorName(_.size));let p=this.heapu8_uint8(_);return this.free_heapu8(_),this.free_heapu8(e),p}decompress(i){let t=this.uint8_heapu8(i),e=this._exports.getFrameContentSize(t.ptr,t.size);this._exports.isError(e)&&console.error(this._exports.getErrorName(e));let o=this.malloc_heapu8(e);o.size=this._exports.decompress(o.ptr,e,t.ptr,t.size),this._exports.isError(o.size)&&console.error(this._exports.getErrorName(o.size));let _=this.heapu8_uint8(o);return this.free_heapu8(o),this.free_heapu8(t),_}defaultCLevel(){return this._exports.defaultCLevel()}minCLevel(){return this._exports.minCLevel()}maxCLevel(){return this._exports.maxCLevel()}};

// Copyright (C) 2007 Chris Double.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice,
//    this list of conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
// DEVELOPERS AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
// OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//


function ParseState(input, index) {
    this.input = input;
    this.index = index || 0;
    this.length = input.length - this.index;
    this.cache = { };
    return this;
}

ParseState.prototype.from = function(index) {
    var r = new ParseState(this.input, this.index + index);
    r.cache = this.cache;
    r.length = this.length - index;
    return r;
};

ParseState.prototype.substring = function(start, end) {
    return this.input.substring(start + this.index, (end || this.length) + this.index);
};

ParseState.prototype.trimLeft = function() {
    var s = this.substring(0);
    var m = s.match(/^\s+/);
    return m ? this.from(m[0].length) : this;
};

ParseState.prototype.at = function(index) {
    return this.input.charAt(this.index + index);
};

ParseState.prototype.toString = function() {
    return 'PS"' + this.substring(0) + '"';
};

ParseState.prototype.getCached = function(pid) {

    var p = this.cache[pid];
    if(p)
        return p[this.index];
    else
        return false;
};

ParseState.prototype.putCached = function(pid, cached) {

    var p = this.cache[pid];
    if(p)
        p[this.index] = cached;
    else {
        p = this.cache[pid] = { };
        p[this.index] = cached;
    }
};

function ps(str) {
    return new ParseState(str);
}

// 'r' is the remaining string to be parsed.
// 'matched' is the portion of the string that
// was successfully matched by the parser.
// 'ast' is the AST returned by the successfull parse.
function make_result(r, matched, ast) {
        return { remaining: r, matched: matched, ast: ast };
}

var parser_id = 0;

// 'token' is a parser combinator that given a string, returns a parser
// that parses that string value. The AST contains the string that was parsed.
function token(s) {
    var pid = parser_id++;
    return function(state) {
        var savedState = state;
        var cached = savedState.getCached(pid);
        if(cached)
            return cached;

        var r = state.length >= s.length && state.substring(0,s.length) == s;
        if(r)
            cached = { remaining: state.from(s.length), matched: s, ast: s };
        else
            cached = false;
        savedState.putCached(pid, cached);
        return cached;
    };
}

// Like 'token' but for a single character. Returns a parser that given a string
// containing a single character, parses that character value.
function ch(c) {
    var pid = parser_id++;
    return function(state) {
        var savedState = state;
        var cached = savedState.getCached(pid);
        if(cached)
            return cached;
        var r = state.length >= 1 && state.at(0) == c;
        if(r)
            cached = { remaining: state.from(1), matched: c, ast: c };
        else
            cached = false;
        savedState.putCached(pid, cached);
        return cached;
    };
}

// 'range' is a parser combinator that returns a single character parser
// (similar to 'ch'). It parses single characters that are in the inclusive
// range of the 'lower' and 'upper' bounds ("a" to "z" for example).
function range(lower, upper) {
    var pid = parser_id++;
    return function(state) {
        var savedState = state;
        var cached = savedState.getCached(pid);
        if(cached)
            return cached;

        if(state.length < 1)
            cached = false;
        else {
            var ch = state.at(0);
            if(ch >= lower && ch <= upper)
                cached = { remaining: state.from(1), matched: ch, ast: ch };
            else
                cached = false;
        }
        savedState.putCached(pid, cached);
        return cached;
    };
}

// Helper function to convert string literals to token parsers
// and perform other implicit parser conversions.
function toParser(p) {
    return (typeof(p) == "string") ? token(p) : p;
}

// Parser combinator that passes the AST generated from the parser 'p'
// to the function 'f'. The result of 'f' is used as the AST in the result.
function action(p, f) {
    var p = toParser(p);
    var pid = parser_id++;
    return function(state) {
        var savedState = state;
        var cached = savedState.getCached(pid);
        if(cached)
            return cached;

        var x = p(state);
        if(x) {
            x.ast = f(x.ast);
            cached = x;
        }
        else {
            cached = false;
        }
        savedState.putCached(pid, cached);
        return cached;
    };
}

// Given a parser that produces an array as an ast, returns a
// parser that produces an ast with the array joined by a separator.
function join_action(p, sep) {
    return action(p, function(ast) { return ast.join(sep); });
}

// 'sequence' is a parser combinator that processes a number of parsers in sequence.
// It can take any number of arguments, each one being a parser. The parser that 'sequence'
// returns succeeds if all the parsers in the sequence succeeds. It fails if any of them fail.
function sequence() {
    var parsers = [];
    for(var i = 0; i < arguments.length; ++i)
        parsers.push(toParser(arguments[i]));
    var pid = parser_id++;
    return function(state) {
        var savedState = state;
        var cached = savedState.getCached(pid);
        if(cached) {
            return cached;
        }

        var ast = [];
        var matched = "";
        var i;
        for(i=0; i< parsers.length; ++i) {
            var parser = parsers[i];
            var result = parser(state);
            if(result) {
                state = result.remaining;
                if(result.ast != undefined) {
                    ast.push(result.ast);
                    matched = matched + result.matched;
                }
            }
            else {
                break;
            }
        }
        if(i == parsers.length) {
            cached = make_result(state, matched, ast);
        }
        else
            cached = false;
        savedState.putCached(pid, cached);
        return cached;
    };
}

// 'choice' is a parser combinator that provides a choice between other parsers.
// It takes any number of parsers as arguments and returns a parser that will try
// each of the given parsers in order. The first one that succeeds results in a
// successfull parse. It fails if all parsers fail.
function choice() {
    var parsers = [];
    for(var i = 0; i < arguments.length; ++i)
        parsers.push(toParser(arguments[i]));
    var pid = parser_id++;
    return function(state) {
        var savedState = state;
        var cached = savedState.getCached(pid);
        if(cached) {
            return cached;
        }
        var i;
        for(i=0; i< parsers.length; ++i) {
            var parser=parsers[i];
            var result = parser(state);
            if(result) {
                break;
            }
        }
        if(i == parsers.length)
            cached = false;
        else
            cached = result;
        savedState.putCached(pid, cached);
        return cached;
    }
}

// 'butnot' is a parser combinator that takes two parsers, 'p1' and 'p2'.
// It returns a parser that succeeds if 'p1' matches and 'p2' does not, or
// 'p1' matches and the matched text is longer that p2's.
// Useful for things like: butnot(IdentifierName, ReservedWord)
function butnot(p1,p2) {
    var p1 = toParser(p1);
    var p2 = toParser(p2);
    var pid = parser_id++;

    // match a but not b. if both match and b's matched text is shorter
    // than a's, a failed match is made
    return function(state) {
        var savedState = state;
        var cached = savedState.getCached(pid);
        if(cached)
            return cached;

        var br = p2(state);
        if(!br) {
            cached = p1(state);
        } else {
            var ar = p1(state);

            if (ar) {
              if(ar.matched.length > br.matched.length)
                  cached = ar;
              else
                  cached = false;
            }
            else {
              cached = false;
            }
        }
        savedState.putCached(pid, cached);
        return cached;
    }
}

// A parser combinator that takes one parser. It returns a parser that
// looks for zero or more matches of the original parser.
function repeat0(p) {
    var p = toParser(p);
    var pid = parser_id++;

    return function(state) {
        var savedState = state;
        var cached = savedState.getCached(pid);
        if(cached) {
            return cached;
        }

        var ast = [];
        var matched = "";
        var result;
        while(result = p(state)) {
            ast.push(result.ast);
            matched = matched + result.matched;
            if(result.remaining.index == state.index)
                break;
            state = result.remaining;
        }
        cached = make_result(state, matched, ast);
        savedState.putCached(pid, cached);
        return cached;
    }
}

// A parser combinator that takes one parser. It returns a parser that
// looks for one or more matches of the original parser.
function repeat1(p) {
    var p = toParser(p);
    var pid = parser_id++;

    return function(state) {
        var savedState = state;
        var cached = savedState.getCached(pid);
        if(cached)
            return cached;

        var ast = [];
        var matched = "";
        var result= p(state);
        if(!result)
            cached = false;
        else {
            while(result) {
                ast.push(result.ast);
                matched = matched + result.matched;
                if(result.remaining.index == state.index)
                    break;
                state = result.remaining;
                result = p(state);
            }
            cached = make_result(state, matched, ast);
        }
        savedState.putCached(pid, cached);
        return cached;
    }
}

// A parser combinator that takes one parser. It returns a parser that
// matches zero or one matches of the original parser.
function optional(p) {
    var p = toParser(p);
    var pid = parser_id++;
    return function(state) {
        var savedState = state;
        var cached = savedState.getCached(pid);
        if(cached)
            return cached;
        var r = p(state);
        cached = r || make_result(state, "", false);
        savedState.putCached(pid, cached);
        return cached;
    }
}



var Pxxl = {};

Pxxl.Font = function(version, comments, properties, glyphs) {
  this.version = version;
  this.comments = comments;
  this.properties = properties;
  this.glyphs = glyphs;
  //console.log(glyphs);
  //console.log("BDF version " + this.version);
  // if (comments && comments.length)
  //   console.log(comments.join(""));
};

Pxxl.Font.prototype = {

  size: function() {
    return this.SIZE[0];
  },

  getGlyph: function(character) {
    var c = character.charCodeAt(0);

    return this.glyphs[c];
  },

  defaultWidth: function () {
    return this.FONTBOUNDINGBOX[0];
  },

  defaultHeight: function () {
    return this.FONTBOUNDINGBOX[1];
  },

  bit: function(text, row, column ) {
    var t = ~~(column / 8);
    if (t < 0 || t > text.length-1) return false;
    var c = text.charCodeAt(t);

    //console.log(t);
    var g = this.glyphs[c];
    if (g)
      return g.bit(row , column % 8);
    else
      return false;
  },

  getPixels : function(text) {
    //console.log(text, x,y, maxWidth);
    this.ctx;
    var hspacing = this.FONTBOUNDINGBOX[0];

    var pixels = [];


    for( var t=0 ; t<text.length ; t++) // characters in a string x
    {
     var chr = text.charCodeAt(t);
     var glyph = this.glyphs[chr];

     var bitmap = glyph.bitmap;
     var dx = t * hspacing;
     var dy = this.defaultHeight() - glyph.height(); // some glyphs have fewer rows

     for ( var r=0 ; r<bitmap.length ; r++) // pixelrows in a glyph y
     {
       var row = bitmap[r];

       for (var b=0 ; b<row.length ; b++) // bytes in a row x
       {
         var byt = row[b];

         var offset = b*8; //consecutive bytes are drawn next to each other
         var bit = 256;

         while (bit >>>= 1) // bits in a byte x
         {
           if (byt & bit)
           {
             var px = dx+offset;
             var py = dy+r;

              pixels.push({x:px, y:py, row:r, column:offset });
           }
           offset++;
         }
       }
     }
    }

    return pixels;
  }
};


Pxxl.Glyph = function (name, bitmap) {
  //console.log("Glyph", name, bitmap);
  this.name = name;
  this.bitmap = bitmap;
};

Pxxl.Glyph.prototype = {

  set: function (x,y,value) {
    var bit = 1 << this.width() - x - 1;
    var byt = ~~(bit/256);
    bit %= (byt+1) * 256;

    //console.log(this.bitmap);

    if (value)
      this.bitmap[y][byt] |= bit;
    else
      this.bitmap[y][byt] &= ~bit;

    //console.log(this.bitmap);
  },

  get: function (x,y) {
    var bit = 1 << this.width() - x - 1;
    var byt = ~~(bit/256);
    bit %= (byt+1) * 256;

    var result = this.bitmap[y][byt] & bit;
    //console.log("x:"+x, "y:"+y, "bit:"+bit, "byte:"+byte, "value:"+result );
    return !!result;
  },

  width: function () {
    return this.BBX[0];
  },

  height: function () {
    return this.BBX[1];
  },

  toString: function() {
    var result = "";
    for (var y=0 ; y<this.bitmap.length ; y++)
    {
      for (var x=0 ; x<this.width() ; x++)
      {
        result += this.get(x,y) ? "*" : " ";
      }
      result += "/n";
    }

    return result;
  }
};
(function() {

var EXCLAMATION_MARK = ch("!");
var AT = ch("@");
var HASH = ch("#");
var DOLLAR = ch("$");
var PERCENT = ch("%");
var CARET = ch("^");
var AMPERSAND = ch("&");
var ASTERISK = ch("*");
var LEFT_PARENTHESIS = ch("(");
var RIGHT_PARENTHESIS = ch(")");
var MINUS = ch("-");
var UNDERSCORE = ch("_");
var PLUS = ch("+");
var EQUALS = ch("=");
var LEFT_ACCOLADE = ch("{");
var RIGHT_ACCOLADE = ch("}");
var LEFT_BRACKET = ch("[");
var RIGHT_BRACKET = ch("]");
var COLON = ch(":");
var SEMICOLON = ch(";");
var QUOTE = ch("'");
var DOUBLE_QUOTE = ch('"');
var PIPE  = ch("|");
var BACKSLASH  = ch("\\");
var TILDE  = ch("~");
var BACKTICK = ch("`");
var COMMA = ch(",");
var PERIOD = ch(".");
var LESS_THAN = ch("<");
var GREATER_THAN = ch(">");
var QUESTION_MARK = ch("?");
var SLASH = ch("/");

var SpecialChar = choice(EXCLAMATION_MARK, AT, HASH, DOLLAR, PERCENT, CARET, AMPERSAND, ASTERISK, LEFT_PARENTHESIS, RIGHT_PARENTHESIS, MINUS, UNDERSCORE, PLUS, EQUALS, LEFT_ACCOLADE, RIGHT_ACCOLADE, LEFT_BRACKET, RIGHT_BRACKET, COLON, SEMICOLON, QUOTE, DOUBLE_QUOTE, PIPE, BACKSLASH, TILDE, BACKTICK, COMMA, PERIOD, LESS_THAN, GREATER_THAN, QUESTION_MARK, SLASH);

var Digit = range("0","9");
var LowerCase = range("a", "z");
var UpperCase = range("A", "Z");

var NEWLINE = ch('\n');
var Space = ch(' ');
ch("\t");

var Alpha = choice(LowerCase, UpperCase);
var AlphaNum = choice(Alpha, Digit);
var NoSpaceChar = choice(AlphaNum, SpecialChar);
var Char = choice(NoSpaceChar, Space);
var Spaces = flatten(repeat1(Space));
var Text = flatten(repeat1(Char));

var EOL = sequence(repeat0(Space), NEWLINE);

var QUOTED_STRING = pick(1, sequence(DOUBLE_QUOTE, flatten(repeat1(butnot(Char, DOUBLE_QUOTE))), DOUBLE_QUOTE));

var HexDigit =  choice(range("a", "f"), range("A", "F"), Digit);
var Byte = action(flatten(sequence(HexDigit,HexDigit)), function(s) { return parseInt(s, 16); });
var ByteArray = repeat1(Byte);
var Natural = flatten(repeat1(Digit));

var NegativeNumber = flatten(sequence(MINUS, Natural));
var Integer = action(choice(Natural, NegativeNumber), parseInt);
//var Word = flatten(repeat1(Alpha));

//var PropName = flatten(sequence(Alpha, flatten(repeat0(choice(Alpha, UNDERSCORE)))));
var PropName = flatten(repeat1(choice(Alpha, UNDERSCORE)));
var Prop1 = action(sequence(PropName, repeat1(pick(1,sequence(Spaces, Integer)))), MakeProp1);
var Prop2 = action(sequence(PropName, Spaces, QUOTED_STRING), MakeProp2);
var Prop3 = action(sequence(PropName, Spaces, flatten(repeat1(NoSpaceChar))), MakeProp2);
var ENDPROPERTIES = token("ENDPROPERTIES");
var Prop = trace(choice(Prop1, Prop2, Prop3, ENDPROPERTIES), "prop");
var PropRow = pick(0, sequence(Prop, EOL));

var BitmapRow = pick(0,sequence( ByteArray, EOL ));
var BITMAP = token("BITMAP");
var BitmapStart = sequence(BITMAP, EOL);
var Bitmap = trace(pick(1, sequence(BitmapStart, repeat0( BitmapRow ))), "bitmap");

var STARTCHAR = token("STARTCHAR");
var ENDCHAR = token("ENDCHAR");
var GlyphStart = trace(pick(2, sequence(STARTCHAR, Space, Text, EOL)), "glyphstart");
var GlyphEnd = sequence(ENDCHAR, EOL);
var Glyph = trace(action(sequence(GlyphStart, repeat0(PropRow), Bitmap, GlyphEnd), MakeGlyph), "glyph");

//var Glyph = action(_Glyph, function(ast) { console.log(ast)} );

var STARTFONT = token("STARTFONT");
var ENDFONT = token("ENDFONT");
var Version = flatten(sequence(Natural, PERIOD, Natural));
var FontStart = trace(pick(2, sequence( STARTFONT, Spaces, Version, EOL )), "fontstart");
var FontEnd = trace(sequence( ENDFONT, optional(EOL)), "fontend"); // EOL optional for now
var COMMENT = token("COMMENT");
var Comment = pick(2, sequence(COMMENT, optional(Space), optional(Text)));
var CommentRow = trace(pick(0, sequence(Comment, EOL)), "comment");


var BDF = action(sequence( repeat0(CommentRow), FontStart, repeat0(CommentRow), repeat0(butnot(PropRow, GlyphStart)), repeat0(Glyph), FontEnd), MakeFont); // empty container is allowed

// input: sequence( FontStart, repeat0(CommentRow), repeat0(butnot(PropRow, GlyphStart)), repeat0(Glyph), FontEnd)
function MakeFont(ast) {
  var formatVersion = ast[1];
  var comments = ast[0].concat(ast[2]);
  var properties = ast[3];
  var glyphs = PropertyList2Hash(ast[4]);
  var f = new Pxxl.Font(formatVersion, comments, properties, glyphs);
  return PropertyBagMixin(f, properties);
}

// input: sequence(GlyphStart, repeat0(PropRow), Bitmap, GlyphEnd
function MakeGlyph(ast) {
  var name = ast[0];
  var properties = ast[1];
  var bitmap = ast[2];
  var g =  new Pxxl.Glyph(name, bitmap);
  //console.log("glyph", g.toString());
  g = PropertyBagMixin(g, properties);
  return { name: g["ENCODING"], value :g};
}

function PropertyBagMixin(obj, proplist) {
  for( var i=0 ; i<proplist.length ; i++ ) {
    var prop = proplist[i];

    // WATCH OUT! possibly overwriting pre-existing properties!
    obj[prop.name] = prop.value;
  }

  return obj;
}

function PropertyList2Hash(proplist) {
  var hash = {};

  for( var i=0 ; i<proplist.length ; i++ ) {
    var prop = proplist[i];

    // WATCH OUT! possibly overwriting pre-existing properties!
    hash[prop.name] = prop.value;
  }

  return hash;
}

function MakeProp1(ast) {
  var value = ast[1];
  var name = ast[0];

  if (name == "ENCODING" || name == "CHARS")
    value = value[0];

  return { name: name, value: value };
}

function MakeProp2(ast) {
  return { name: ast[0], value: ast[2] };
}

function flatten(p) {
  return join_action(p, "");
}

function pick(i, p) {
  return action(p, function(ast) { return ast[i]; });
}

function trace(p, label) {
  var traceon = Pxxl.trace;
  var traceall = Pxxl.traceall;

  if (!traceon) return p;

  return function(state) {
    var result = p(state);
    if (!result.ast) {
      var matched = state.input.substring(0,state.index);
      var lines = matched.split("\n");
      //lines[lines.length-1]
      console.error(label, "failed at line", lines.length, state);
    }
    if (result.ast && traceall)
      console.log(label, "matches", result.matched, "\nAST:", result.ast);

    return result;
  }
}

function pre(input) {
  var lines = input.split("\n");
  for (var l=lines.length-1 ; l>=0 ; l--) {
    var line = ltrim(lines[l]);

    if (line == "")
      lines.splice(l, 1);
    else
      lines[l] = line;
  }

  return lines.join("\n");
}

function ltrim(stringToTrim) {
	return stringToTrim.replace(/^\s+/,"");
}

function parseBDF (input, trace, traceall) {
  Pxxl.trace = trace;
  Pxxl.traceall = traceall;

  input = pre(input);
  var state = ps(input);
  var result = BDF(state);

  if (result.ast) {
    //console.log("parsing took: " + time + "ms");
    return result.ast;
  }

  throw new Error("Unable to parse font!");
}

// export only single function
Pxxl.Font.ParseBDF = parseBDF;

})();

Pxxl.Glyph.ParseJSON = function (obj) {

  var g = new Pxxl.Glyph(obj.name, obj.bitmap);

  // shallow copy
  for (var k in obj) {
    if (obj.hasOwnProperty(k))
      g[k] = obj[k];
  }
  //console.log("glyph", g.toString());
  return g;
};

Pxxl.Font.ParseJSON = function (obj) {
  var f = new Pxxl.Font(obj.version, obj.comments, obj.properties, {});
  //console.log(f);
  for (var k in obj) {
    if (obj.hasOwnProperty(k) && k != "glyphs")
      f[k] = obj[k];
  }

  f.glyphs = {};
  for (var g in obj.glyphs) {
    //console.log(g);
    if (obj.glyphs.hasOwnProperty(g))
      f.glyphs[g] = Pxxl.Glyph.ParseJSON(obj.glyphs[g]);
  }
  return f;
};
(function() {
  //from: http://www.quirksmode.org/js/xmlhttp.html
  function sendRequest(url,callback,postData) {
      var req = createXMLHTTPObject();
      if (!req) return;
      var method = "GET";
      req.open(method,url,true);
      req.onreadystatechange = function () {
          if (req.readyState != 4) return;
          if (req.status != 200 && req.status != 304) {
  //          alert('HTTP error ' + req.status);
              return;
          }
          callback(req);
      };
      if (req.readyState == 4) return;
      req.send(postData);
  }

  var XMLHttpFactories = [
      function () {return new XMLHttpRequest()},
      function () {return new ActiveXObject("Msxml2.XMLHTTP")},
      function () {return new ActiveXObject("Msxml3.XMLHTTP")},
      function () {return new ActiveXObject("Microsoft.XMLHTTP")}
  ];

  function createXMLHTTPObject() {
      var xmlhttp = false;
      for (var i=0;i<XMLHttpFactories.length;i++) {
          try {
              xmlhttp = XMLHttpFactories[i]();
          }
          catch (e) {
              continue;
          }
          break;
      }
      return xmlhttp;
  }


  function LoadFont(url, callback) {
    // FIXME: determine type based on mimetype and/or extension
    // if(url.indexOf("json") > -1 )
    //   $.getJSON(url, function(data) {
    //     callback(Pxxl.Font.ParseJSON(data));
    //   });
    // else
    sendRequest(url,function(req) {
      callback(Pxxl.Font.ParseBDF(req.responseText));
    });
  }
  // memoization funcion for use with callbacks
  function memoize2(f) {
    var cache = {};

    return function (arg, callback) {
      var cached = cache[arg];

      if (typeof cached !== 'undefined') {
        //console.log('cache hit: ', arg);
        return callback(cached);
      }
      else {
        //console.log('cache miss:', arg);
        return f(arg, function(result) {
          cache[arg] = result;
          return callback(result);
        });
      }
    };
  }

  Pxxl.LoadFont = memoize2(LoadFont);

})();

const zstd = await ee.load();
const pf = Pxxl.Font.ParseBDF(Deno.readTextFileSync("assets/5x7.bdf"));
function fpng(label,text) {
  const f_sides = 2;
  const f_tracks = 80;
  const f_sectors = 18;
  const f_bytes = 512;
  const dat = zstd.compress(new TextEncoder().encode(text),22);
  const width = 1024;
  const font_height = 7;
  console.log(
    `1.44 MB Floppy Disk Size=${f_sides * f_tracks * f_sectors * f_bytes}`,
  );
  const head = new Uint8Array(width * font_height).fill(255);
  const dat_rows = (dat.length) % width == 0
    ? (dat.length) / width
    : Math.floor(dat.length / width) + 1;
  const dat_fill = new Uint8Array(dat_rows * width - dat.length).fill(
    32,
  );
  const flp_dat_arr = new Uint8Array([
    ...head,
    ...dat,
    ...dat_fill,
  ]);
  const pixels = pf.getPixels(label);
  for (const pixel of pixels) {
    for (let i = 0; i < 4; i++) {
      flp_dat_arr[
        (pixel.x + pixel.y * width / 4) * 4 + i
      ] = [0, 0, 0, 255][i];
    }
  }
  const img=new Uint8Array(
    UPNG.encodeLL(
      [flp_dat_arr],
      width / 4,
      dat_rows + font_height,
      3,
      1,
      8
    ),
  );
  console.log(
    `Floppy PNG Size=${img.length}`,
  );
  return {"im":img,"ln":dat.length}
}

/*
MIT License

Copyright (c) 2020 Egor Nepomnyaschih

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
/*
// This constant can also be computed with the following algorithm:
const base64abc = [],
    A = "A".charCodeAt(0),
    a = "a".charCodeAt(0),
    n = "0".charCodeAt(0);
for (let i = 0; i < 26; ++i) {
    base64abc.push(String.fromCharCode(A + i));
}
for (let i = 0; i < 26; ++i) {
    base64abc.push(String.fromCharCode(a + i));
}
for (let i = 0; i < 10; ++i) {
    base64abc.push(String.fromCharCode(n + i));
}
base64abc.push("+");
base64abc.push("/");
*/
const base64abc = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"
];
function bytesToBase64(bytes) {
    let result = '', i, l = bytes.length;
    for (i = 2; i < l; i += 3) {
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[((bytes[i - 1] & 0x0F) << 2) | (bytes[i] >> 6)];
        result += base64abc[bytes[i] & 0x3F];
    }
    if (i === l + 1) { // 1 octet yet to write
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[(bytes[i - 2] & 0x03) << 4];
        result += "==";
    }
    if (i === l) { // 2 octets yet to write
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[(bytes[i - 1] & 0x0F) << 2];
        result += "=";
    }
    return result;
}

const metadata=JSON.parse(Deno.readTextFileSync("assets/metadata.json"));
const dt = new Date();
const tss = dt.toISOString().replaceAll(":", "").replaceAll("-","").replaceAll(".","");
async function create(site,backup) {
  const st = JSON.stringify(site);
  Deno.writeTextFileSync("site.txt", `let site=${st}\n`);
  const text = Deno.readTextFileSync("site.txt") +
    Deno.readTextFileSync("dist/app.bundle.js");
  function arr_to_hex(u8arr) {
    return `${Array.from(u8arr, (i) => i.toString(16).padStart(2, "0")).join("")
      }`;
  }
  const last_hash = Deno.readTextFileSync("data_sha512.txt");
  const cur_hash = arr_to_hex(
    new Uint8Array(
      await crypto.subtle.digest("SHA-512", new TextEncoder().encode(text)),
    ),
  );
  if (last_hash.trim() != cur_hash.trim()) {
    Deno.writeTextFileSync("data_sha512.txt", cur_hash);
    const fp_obj = fpng(` Verify sig at floppypng.com - ${tss}`, text);
    const a32h = arr_to_hex(fp_obj.im.slice(-20, -16));
    console.log(`Generated FloppyPNG Size=${fp_obj.ln}`);

    const priv = Deno.readTextFileSync(Deno.env.get("CL_PRIV")).replace(
      /.*KEY-----(.+?)-----END.*/smg,
      "$1",
    );
    const b_der_str = globalThis.atob(priv);
    const b_der = Uint8Array.from([...b_der_str].map((c) =>
      c.charCodeAt()
    )).buffer;
    const prv = await globalThis.crypto.subtle.importKey(
      "pkcs8",
      b_der,
      {
        name: "RSA-PSS",
        hash: "SHA-256",
      },
      true,
      ["sign"],
    );
    const sig = await crypto.subtle.sign(
      {
        name: "RSA-PSS",
        hash: "SHA-256",
        saltLength: 32,
      },
      prv,
      fp_obj.im,
    );
    const u8sig = new Uint8Array(sig);
    Deno.writeFileSync(`${tss}-${a32h}.png`, fp_obj.im);
    Deno.writeTextFileSync(`${tss}-${a32h}.txt`, bytesToBase64(u8sig));
    Deno.writeFileSync(`${backup}${tss}-${a32h}.png`, fp_obj.im);
    for await (const i of Deno.readDir("./")) {
      if (
        i.name != `${tss}-${a32h}.js` &&
        i.name.match(/^\d{8}T\d{9}Z\-\w{8}.js$/)
      ) {
        console.log(`removing ${i.name}`);
        Deno.remove(i.name);
      }
      if (
        i.name != `${tss}-${a32h}.png` &&
        i.name.match(/^\d{8}T\d{9}Z\-\w{8}.png$/)
      ) {
        console.log(`removing ${i.name}`);
        Deno.remove(i.name);
      }
      if (
        i.name != `${tss}-${a32h}.txt` &&
        i.name.match(/^\d{8}T\d{9}Z\-\w{8}.txt$/)
      ) {
        console.log(`removing ${i.name}`);
        Deno.remove(i.name);
      }
    }
    console.log(`${tss}-${a32h}`);
    Deno.writeTextFileSync(
      `${tss}-${a32h}.js`,
      Deno.readTextFileSync(`assets/bootloader.template.js`)
        .replaceAll("thisistss", tss)
        .replaceAll("thisisadler", a32h)
        .replaceAll("thisistextlength", st.length)
        .replaceAll("thisislength", fp_obj.ln),
    );
    for (let i in metadata){
    Deno.writeTextFileSync(
      `${i}.page.html`,
      Deno.readTextFileSync(`assets/pageops.html`)
        .replace("<title></title>",`<title>${metadata[i].title}</title>`)
        .replace(`<meta name="description" content="">`,`<meta name="description" content="${metadata[i].description}">`)
        .replaceAll("thisistss", tss)
        .replaceAll("thisisadler", a32h)
    );
  }
  }
}
function web_deal(req) {
  if (req.method == "GET") {
    const u = new URL(req.url);
    const page = u.pathname == "/"
      ? `${Object.keys(metadata)[0]}.page.html`
      : u.pathname.replace("/", "");
    let npg;
    let response;
    try {
      console.log(page);
      npg = Deno.readFileSync(page);
      const type = page.split(".").slice(-1);
      response = new Response(npg, {
        status: 200,
        headers: {
          "content-type": types[type],
        },
      });
    } catch {
      console.log("error 404");
      response = new Response(npg, {
        status: 404,
        headers: {
          "content-type": "text/plain;charset=utf-8",
        },
      });
    }
    return response;
  }
}
const types = {
  "js": "text/javascript;charset=utf-8",
  "mjs": "text/javascript;charset=utf-8",
  "css": "text/css",
  "svg": "image/svg+xml",
  "html": "text/html",
  "map": "application/json",
  "json": "application/json",
  "xz": "application/gzip",
  "png": "image/png",
  "zst": "application/zstd",
  "txt": "text/plain",
  "jpg": "image/jpg",
  "gif": "image/gif",
  "WebM": "video/webm",
  "mp4": "video/mp4",
  "mpg": "video/mp4",
  "webm": "video/webm",
  "ico": "image/x-icon",
};

const backup = Deno.env.get("CL_ORN_BACKUP");
const now_text = Deno.readTextFileSync("site_long.txt").trim();
let st = "";
for (const i of now_text.split("\n")) {
  i.slice(0, 12) == '["m1k","wsx"'
    ? st += `["m1k","wsx",${
      JSON.stringify(Deno.readTextFileSync("assets/style.css").trim())
    }],\n`
    : i.slice(0, 12) == '["mn2","wsx"'
    ? st += `["mn2","wsx",${
      JSON.stringify(Deno.readTextFileSync("assets/page.html").trim())
    }],\n`
    : st += `${i}\n`;
}
Deno.writeTextFileSync("site_long.txt", st);
let mod_site=JSON.parse(st);
create(mod_site,backup);
Deno.serve({
  port: 3052,
  hostname: "0.0.0.0",
  handler: (req) => web_deal(req),
});
