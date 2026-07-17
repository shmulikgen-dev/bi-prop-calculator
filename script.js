// Tab Switching
function switchTab(event, tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById('tab-' + tabId).style.display = 'block';
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// ==========================================
// 1. COMBUSTION STABILITY LOGIC
// ==========================================
function calculateStability() {
    const A = parseFloat(document.getElementById('A').value);
    const C = parseFloat(document.getElementById('C').value);
    const m = parseFloat(document.getElementById('m').value);
    const Pc = parseFloat(document.getElementById('Pc').value);
    const k = parseFloat(document.getElementById('k').value);
    const E_a = parseFloat(document.getElementById('E_a').value);
    const R = parseFloat(document.getElementById('R').value);
    const T = parseFloat(document.getElementById('T').value);
    const SMD = parseFloat(document.getElementById('SMD').value);
    const K_evap = parseFloat(document.getElementById('K_evap').value);
    const q = parseFloat(document.getElementById('q').value);
    const c = parseFloat(document.getElementById('c').value);
    const D = parseFloat(document.getElementById('D').value);

    const term1 = 1 / (Math.pow(C, m) * Math.pow(Pc, k));
    const term2 = Math.exp(E_a / (R * T));
    const tau_id_sec = A * term1 * term2;
    const tau_vap_sec = Math.pow(SMD, 2) / (K_evap * Math.pow(Pc, q));

    const tau_id_ms = tau_id_sec * 1000;
    const tau_vap_ms = tau_vap_sec * 1000;
    const tau_total_ms = tau_id_ms + tau_vap_ms;

    const f_1T = (1.841 * c) / (Math.PI * D);
    const T_acoust_sec = 1 / (2 * f_1T);
    const T_acoust_ms = T_acoust_sec * 1000;

    const formatNumber = (num) => {
        if (!isFinite(num) || isNaN(num)) return "N/A";
        if (num > 1e6 || (num < 1e-3 && num > 0)) return num.toExponential(4);
        return num.toFixed(3);
    };

    document.getElementById('res-tau-id').textContent = formatNumber(tau_id_ms) + ' ms';
    document.getElementById('res-tau-vap').textContent = formatNumber(tau_vap_ms) + ' ms';
    document.getElementById('res-tau-total').textContent = formatNumber(tau_total_ms) + ' ms';
    document.getElementById('res-f1t').textContent = formatNumber(f_1T) + ' Hz';
    document.getElementById('res-tacoust').textContent = formatNumber(T_acoust_ms) + ' ms';

    const diffRatio = Math.abs(tau_total_ms - T_acoust_ms) / T_acoust_ms;
    const alertWarning = document.getElementById('stability-alert');
    const alertOk = document.getElementById('stability-ok');
    
    if (diffRatio < 0.20) {
        alertWarning.classList.remove('hidden');
        alertOk.classList.add('hidden');
    } else {
        alertOk.classList.remove('hidden');
        alertWarning.classList.add('hidden');
    }
}

document.getElementById('calc-form').addEventListener('submit', function(e) {
    e.preventDefault();
    calculateStability();
});

const presets = {
    jp8: { A: 5e-10, C: 5, m: 1.0, Pc: 15, k: 1.0, E_a: 45000, R: 8.314, T: 300, SMD: 0.0005, K_evap: 0.08, q: 0.5, c: 1100, D: 0.05, desc: "<strong>Baseline: JP-8 with Additive & HTP 90%.</strong> Stable chemical induction (~0.4 ms)." },
    engine: { A: 2e-10, C: 8, m: 1.2, Pc: 50, k: 0.8, E_a: 40000, R: 8.314, T: 320, SMD: 0.0002, K_evap: 0.12, q: 0.4, c: 1200, D: 0.1, desc: "<strong>Research Engine: 500N Orbital Thruster.</strong> High pressure, ultra-fast ignition." },
    unstable: { A: 1.7e-10, C: 5, m: 1.0, Pc: 15, k: 1.0, E_a: 45000, R: 8.314, T: 300, SMD: 0.0005, K_evap: 0.08, q: 0.5, c: 1100, D: 0.2, desc: "<strong>Danger: Unstable Resonance (Hard Start).</strong> 20cm chamber perfectly matches tau." }
};

function loadPreset(presetKey) {
    const data = presets[presetKey];
    if (!data) return;
    Object.keys(data).forEach(key => {
        if (key !== 'desc') {
            const el = document.getElementById(key);
            if (el) el.value = data[key];
        }
    });
    const descEl = document.getElementById('preset-desc');
    descEl.innerHTML = data.desc;
    descEl.classList.remove('hidden');
    calculateStability();
}
document.getElementById('btn-preset-jp8').addEventListener('click', () => loadPreset('jp8'));
document.getElementById('btn-preset-engine').addEventListener('click', () => loadPreset('engine'));
document.getElementById('btn-preset-unstable').addEventListener('click', () => loadPreset('unstable'));

// ==========================================
// 2. ENGINE SIZING & COOLING LOGIC
// ==========================================

// Experimental Data LocalStorage
function loadExperimentalData() {
    const cstar = localStorage.getItem('exp_cstar_eff');
    const cf = localStorage.getItem('exp_cf_eff');
    if (cstar) document.getElementById('exp_cstar_eff').value = cstar;
    if (cf) document.getElementById('exp_cf_eff').value = cf;
}
document.getElementById('btn-save-exp').addEventListener('click', () => {
    localStorage.setItem('exp_cstar_eff', document.getElementById('exp_cstar_eff').value);
    localStorage.setItem('exp_cf_eff', document.getElementById('exp_cf_eff').value);
    const msg = document.getElementById('exp-save-msg');
    msg.style.display = 'block';
    msg.textContent = 'Data saved to LocalStorage!';
    setTimeout(() => msg.style.display = 'none', 3000);
});
document.getElementById('btn-clear-exp').addEventListener('click', () => {
    localStorage.removeItem('exp_cstar_eff');
    localStorage.removeItem('exp_cf_eff');
    document.getElementById('exp_cstar_eff').value = '1.0';
    document.getElementById('exp_cf_eff').value = '1.0';
    const msg = document.getElementById('exp-save-msg');
    msg.style.display = 'block';
    msg.style.color = 'var(--text-secondary)';
    msg.textContent = 'Cleared.';
    setTimeout(() => { msg.style.display = 'none'; msg.style.color = 'var(--success)'; }, 2000);
});

function calculateSizing() {
    const F = parseFloat(document.getElementById('req_thrust').value);
    const Pc_bar = parseFloat(document.getElementById('size_Pc').value);
    const Pa_bar = parseFloat(document.getElementById('size_Pa').value);
    const OF = parseFloat(document.getElementById('size_OF').value);
    
    let Lstar = parseFloat(document.getElementById('size_Lstar').value);
    let CR = parseFloat(document.getElementById('size_CR').value);
    
    // Defensive Check against Division by Zero (DoS Prevention)
    if (F <= 0 || Pc_bar <= 0 || OF <= 0 || CR <= 0) {
        alert("Security / Stability Warning: Critical parameters (Thrust, Pc, O/F, CR) must be strictly greater than 0.");
        return;
    }
    
    const max_D_input = document.getElementById('max_D').value;
    const max_L_input = document.getElementById('max_L').value;
    const min_L_input = document.getElementById('min_L').value;
    const max_D = max_D_input ? parseFloat(max_D_input) / 100 : null; // cm to m
    const max_L = max_L_input ? parseFloat(max_L_input) / 100 : null; // cm to m
    const min_L = min_L_input ? parseFloat(min_L_input) / 100 : 0.01; // cm to m

    const Pf_bar = parseFloat(document.getElementById('size_Pf').value);
    const allow_stress_MPa = parseFloat(document.getElementById('allow_stress').value);
    let t_rib_mm = parseFloat(document.getElementById('rib_thick').value);
    const k_w = parseFloat(document.getElementById('kw').value);
    const Tc = parseFloat(document.getElementById('Tc').value);
    
    const user_chf_limit = parseFloat(document.getElementById('user_chf').value) * 1e6 || 20e6;
    const user_wt_val = document.getElementById('user_wt').value;
    const user_h_val = document.getElementById('user_h').value;
    const custom_wt = user_wt_val ? parseFloat(user_wt_val) : null;
    const custom_h = user_h_val ? parseFloat(user_h_val) : null;
    
    const inj_porosity = parseFloat(document.getElementById('inj_porosity').value) / 100 || 0.1;
    const inj_D_user_val = document.getElementById('inj_D_user').value;
    const custom_inj_D = inj_D_user_val ? parseFloat(inj_D_user_val) / 100 : null; // cm to m
    
    // Infer advanced material properties based on dropdown for thermal stress
    const matSelect = document.getElementById('material_preset').value;
    let E = 110e9; let alpha = 17e-6; let nu = 0.33; let rho_mat = 8960; // Copper defaults
    if (matSelect === 'inconel') {
        E = 200e9; alpha = 13e-6; nu = 0.29; rho_mat = 8190;
    } else if (matSelect === 'ss') {
        E = 190e9; alpha = 16e-6; nu = 0.27; rho_mat = 8000;
    }

    const eff_cstar = parseFloat(document.getElementById('exp_cstar_eff').value) || 1.0;
    const eff_cf = parseFloat(document.getElementById('exp_cf_eff').value) || 1.0;

    // Constants & Default assumed performance for HTP90/JP8
    const g0 = 9.81;
    const gamma = 1.15; 
    
    // Theoretical limits (Adjusted by experimental efficiency)
    let cstar_ideal = 1550; // m/s
    let Isp_ideal = 260; // s
    
    let cstar = cstar_ideal * eff_cstar;
    let Isp = Isp_ideal * eff_cstar * eff_cf; 
    
    // Pressures in Pa
    const Pc = Pc_bar * 1e5;
    const Pa = Pa_bar * 1e5;
    const Pf = Pf_bar * 1e5;

    // 1. Mass Flow
    const mdot = F / (Isp * g0);
    const mdot_f = mdot / (1 + OF);
    const mdot_o = mdot - mdot_f;

    // 2. Throat Area & Diameter
    const At = (mdot * cstar) / Pc; // m^2
    const Dt = Math.sqrt((4 * At) / Math.PI); // m

    // 2.5 Injector Sizing & Constraints
    const dP = Pf - Pc;
    let A_inj = 0;
    let D_inj = 0;
    if (dP > 0) {
        const rho_f = 800; // kg/m3 for JP8
        const rho_o = 1400; // kg/m3 for HTP
        const Cd = 0.7; // Discharge coefficient
        const A_inj_f = mdot_f / (Cd * Math.sqrt(2 * rho_f * dP));
        const A_inj_o = mdot_o / (Cd * Math.sqrt(2 * rho_o * dP));
        A_inj = (A_inj_f + A_inj_o); // in m^2
        
        if (custom_inj_D) {
            D_inj = custom_inj_D;
        } else {
            const A_face = A_inj / inj_porosity;
            D_inj = Math.sqrt((4 * A_face) / Math.PI);
        }
    }

    // 3. Chamber Area & Length (with constraint checking)
    let Ac = CR * At;
    let Dc = Math.sqrt((4 * Ac) / Math.PI);
    let Lc = Lstar / CR; 
    
    let constraint_msg = [];

    if (min_L && Lc < min_L) {
        Lc = min_L;
        Lstar = Lc * CR; // Reverse calculate actual L*
        constraint_msg.push(`Chamber length was increased to meet the Reaction Plane Dist. (${(min_L * 100).toFixed(1)} cm) requirement. Actual L* increased to ${Lstar.toFixed(2)} m.`);
    }

    if (D_inj > 0 && Dc < D_inj) {
        Dc = D_inj;
        Ac = Math.PI * Math.pow(Dc, 2) / 4;
        CR = Ac / At; // Reverse calculate actual CR
        Lc = Lstar / CR; // Lc might change due to new CR
        // Check min_L again in case the new Lc dropped below it
        if (min_L && Lc < min_L) {
            Lc = min_L;
            Lstar = Lc * CR; // Final L* adjustment
            constraint_msg.push(`Chamber length was also constrained by Reaction Plane Dist. Actual L* is now ${Lstar.toFixed(2)} m.`);
        }
        constraint_msg.push(`Chamber diameter was increased to match the required Injector Face Diameter. CR updated to ${CR.toFixed(2)}.`);
    }

    if (max_D && Dc > max_D) {
        Dc = max_D;
        Ac = Math.PI * Math.pow(Dc, 2) / 4;
        CR = Ac / At; // Reverse calculate actual CR
        Lc = Lstar / CR; // Lc might change due to new CR
        constraint_msg.push(`Max Diameter reached. CR reduced to ${CR.toFixed(2)}.`);
    }

    if (max_L && Lc > max_L) {
        Lc = max_L;
        Lstar = Lc * CR; // Reverse calculate actual L*
        constraint_msg.push(`Max Length reached. L* reduced to ${Lstar.toFixed(2)} m.`);
    }
    
    const alertBox = document.getElementById('constraint-alert');
    if (constraint_msg.length > 0) {
        alertBox.classList.remove('hidden');
        document.getElementById('constraint-msg').innerHTML = constraint_msg.join('<br>');
    } else {
        alertBox.classList.add('hidden');
    }

    // 4. Expansion Ratio 
    let eps = 1.0;
    if (Pa > 0 && Pa < Pc) {
        const pr = Pa / Pc;
        const term1 = (gamma + 1)/2;
        const term2 = 1 / (gamma - 1);
        const term3 = Math.pow(pr, 1/gamma);
        const term4 = Math.sqrt( (gamma+1)/(gamma-1) * (1 - Math.pow(pr, (gamma-1)/gamma)) );
        eps = Math.pow(term1, term2) / (term3 * term4);
    } else if (Pa === 0) {
        eps = 50;
    }
    const Ae = eps * At;
    const De = Math.sqrt((4 * Ae) / Math.PI);

    // Injector Sizing already handled in 2.5
    // Just format A_inj in mm^2 for legacy reference
    A_inj = A_inj * 1e6; // in mm^2

    // 6. Automated Regenerative Cooling (Using HTP mdot_o)
    const rho_cool = 1400; 
    
    // a) Wall Thickness
    const allow_stress_Pa = allow_stress_MPa * 1e6;
    let t_w = (Pc * Dc) / (2 * allow_stress_Pa); // in meters
    let t_w_mm = t_w * 1000;
    
    // b) Number of Channels & Rib Structural Optimization
    let w_t_target_mm = custom_wt ? custom_wt : 1.5;
    const Dt_mm = Dt * 1000;
    const Dc_mm = Dc * 1000;
    
    // Iterative solver for minimum required rib thickness
    let t_rib_mm_actual = t_rib_mm;
    let N_chan = 1;
    let iteration = 0;
    const dP_MPa = Math.max(0, (Pf_bar - Pc_bar) / 10); // bar to MPa

    while (iteration < 10) {
        N_chan = Math.max(1, Math.floor( (Math.PI * Dt_mm) / (w_t_target_mm + t_rib_mm_actual) ));
        let pitch_c = (Math.PI * Dc_mm) / N_chan;
        let t_rib_structural = (dP_MPa * pitch_c) / allow_stress_MPa;
        
        // Add a small convergence tolerance
        if (t_rib_structural > t_rib_mm_actual + 0.001) {
            t_rib_mm_actual = t_rib_structural;
            iteration++;
        } else {
            break; // Valid structurally
        }
    }
    
    if (t_rib_mm_actual > t_rib_mm + 0.01) {
        constraint_msg.push(`Rib thickness was structurally increased from ${t_rib_mm.toFixed(2)} mm to ${t_rib_mm_actual.toFixed(2)} mm to withstand ${dP_MPa.toFixed(1)} MPa pressure diff.`);
    }
    
    t_rib_mm = t_rib_mm_actual;
    
    // Re-check constraint alert box since we might have added a new message here
    if (constraint_msg.length > 0) {
        alertBox.classList.remove('hidden');
        document.getElementById('constraint-msg').innerHTML = constraint_msg.join('<br>');
    }
    
    // c) Channel Dimensions
    const w_t_mm = ((Math.PI * Dt_mm) / N_chan) - t_rib_mm;
    const w_c_mm = ((Math.PI * Dc_mm) / N_chan) - t_rib_mm;
    
    // Set constant channel height based on 1.5 aspect ratio at the throat (if not user-defined)
    const h_mm = custom_h ? custom_h : (1.5 * w_t_mm);
    
    // d) Coolant Velocities
    const A_chan_t_m2 = (w_t_mm / 1000) * (h_mm / 1000);
    const A_chan_c_m2 = (w_c_mm / 1000) * (h_mm / 1000);
    
    const v_t = mdot_o / (N_chan * A_chan_t_m2 * rho_cool);
    const v_c = mdot_o / (N_chan * A_chan_c_m2 * rho_cool);

    // 7. Thermal Analysis & Wall Thickness Optimization
    // a) Hot Gas Side (Simplified Bartz Equation)
    const mu_g = 1.2e-4; // Pa s
    const Cp_g = 2500; // J/kgK
    const Pr_g = 0.8;
    const prop_term = (Math.pow(mu_g, 0.2) * Cp_g) / Math.pow(Pr_g, 0.6); // ~ 470
    const h_g = (0.026 / Math.pow(Dt, 0.2)) * prop_term * Math.pow(Pc / cstar, 0.8);
    
    // b) Liquid Coolant Side (Dittus-Boelter for HTP)
    const mu_l = 1.0e-3; // Pa s
    const Cp_l = 2600; // J/kgK
    const k_l = 0.3; // W/mK
    const Pr_l = (Cp_l * mu_l) / k_l; // ~ 8.6
    
    const w_t_m = w_t_mm / 1000;
    const h_m = h_mm / 1000;
    const Dh_t = (4 * A_chan_t_m2) / (2 * (w_t_m + h_m));
    const Re_t = (rho_cool * v_t * Dh_t) / mu_l;
    const Nu_t = 0.023 * Math.pow(Re_t, 0.8) * Math.pow(Pr_l, 0.4);
    const h_c_t = (Nu_t * k_l) / Dh_t;
    
    // c) Optimize Wall Thickness (minimize total stress)
    const T_co = 300; // Coolant inlet temp K
    let min_sig_tot = Infinity;
    let opt_tw_m = 0.001;
    let opt_sig_p = 0;
    let opt_sig_th = 0;
    let opt_q = 0;
    
    for (let test_tw_mm = 0.1; test_tw_mm <= 5.0; test_tw_mm += 0.05) {
        const test_tw = test_tw_mm / 1000;
        
        // Heat transfer
        const R_g = 1 / h_g;
        const R_w = test_tw / k_w;
        const R_c = 1 / h_c_t;
        const q_test = (Tc - T_co) / (R_g + R_w + R_c);
        const delta_T = q_test * R_w;
        
        // Stresses
        const sig_p = (Pc * Dc) / (2 * test_tw);
        const sig_th = (alpha * E * delta_T) / (2 * (1 - nu));
        const sig_tot = sig_p + sig_th;
        
        if (sig_tot < min_sig_tot) {
            min_sig_tot = sig_tot;
            opt_tw_m = test_tw;
            opt_sig_p = sig_p;
            opt_sig_th = sig_th;
            opt_q = q_test;
        }
    }
    
    t_w_mm = opt_tw_m * 1000;
    t_w = opt_tw_m;
    const Twg = Tc - (opt_q / h_g);
    const Twc = Twg - (opt_q * (opt_tw_m / k_w));

    // Output formatting
    if (document.getElementById('res-mdot')) document.getElementById('res-mdot').textContent = mdot.toFixed(3) + ' kg/s';
    if (document.getElementById('res-isp')) document.getElementById('res-isp').textContent = Isp.toFixed(1) + ' s';
    if (document.getElementById('res-cstar')) document.getElementById('res-cstar').textContent = cstar.toFixed(0) + ' m/s';
    if (document.getElementById('res-dt')) document.getElementById('res-dt').textContent = (Dt * 100).toFixed(2) + ' cm';
    if (document.getElementById('res-dc')) document.getElementById('res-dc').textContent = (Dc * 100).toFixed(2) + ' cm';
    if (document.getElementById('res-lc')) document.getElementById('res-lc').textContent = (Lc * 100).toFixed(2) + ' cm';
    if (document.getElementById('res-de')) document.getElementById('res-de').textContent = (De * 100).toFixed(2) + ' cm';
    if (document.getElementById('res-eps')) document.getElementById('res-eps').textContent = eps.toFixed(1);
    if (document.getElementById('res-actual-cr')) document.getElementById('res-actual-cr').textContent = CR.toFixed(2);
    if (document.getElementById('res-actual-lstar')) document.getElementById('res-actual-lstar').textContent = Lstar.toFixed(2) + ' m';
    
    document.querySelectorAll('.res-ainj').forEach(el => {
        el.textContent = typeof A_inj !== 'undefined' ? (A_inj > 0 ? A_inj.toFixed(1) + ' mm²' : 'Invalid (Pf ≤ Pc)') : '--';
        if (A_inj <= 0) el.style.color = 'var(--danger)';
        else el.style.color = '';
    });
    
    if (document.getElementById('res-dinj')) document.getElementById('res-dinj').textContent = (D_inj > 0 ? (D_inj * 100).toFixed(2) + ' cm' : '--');
    
    document.getElementById('res-tw').textContent = t_w_mm.toFixed(2) + ' mm';
    document.getElementById('res-sig-p').textContent = (opt_sig_p / 1e6).toFixed(1) + ' MPa';
    document.getElementById('res-sig-th').textContent = (opt_sig_th / 1e6).toFixed(1) + ' MPa';
    document.getElementById('res-sig-tot').textContent = (min_sig_tot / 1e6).toFixed(1) + ' MPa';
    
    const stressAlert = document.getElementById('stress-alert');
    if (min_sig_tot > allow_stress_MPa * 1e6) {
        stressAlert.classList.remove('hidden');
    } else {
        stressAlert.classList.add('hidden');
    }

    document.getElementById('res-nchan').textContent = N_chan;
    document.getElementById('res-vt').textContent = v_t.toFixed(1) + ' m/s';
    document.getElementById('res-vc').textContent = v_c.toFixed(1) + ' m/s';
    document.getElementById('res-h').textContent = h_mm.toFixed(2) + ' mm';
    
    // Thermal outputs
    document.getElementById('res-q').textContent = (opt_q / 1e6).toFixed(2) + ' MW/m²';
    document.getElementById('res-twg').textContent = Twg.toFixed(0) + ' K';
    document.getElementById('res-twc').textContent = Twc.toFixed(0) + ' K';
    
    // CHF Alert
    const chfAlert = document.getElementById('chf-alert');
    if (opt_q > user_chf_limit) {
        chfAlert.classList.remove('hidden');
        document.getElementById('chf-msg').innerHTML = `The heat flux at the throat (${(opt_q/1e6).toFixed(2)} MW/m²) exceeds the defined CHF limit of ${(user_chf_limit/1e6).toFixed(2)} MW/m²!`;
    } else {
        chfAlert.classList.add('hidden');
    }
    
    // Alerts
    const limit_Twg = (k_w > 100) ? 900 : 1200; // Copper safe limit vs Inconel
    const alertHot = document.getElementById('thermal-alert-hot');
    const msgHot = document.getElementById('thermal-msg-hot');
    const recHot = document.getElementById('thermal-rec-hot');
    if (Twg > limit_Twg) {
        alertHot.classList.remove('hidden');
        msgHot.textContent = `Wall temp (${Twg.toFixed(0)}K) exceeds safe limit (${limit_Twg}K) for this material!`;
        recHot.innerHTML = `
            <li><strong>Material:</strong> Switch to a material with higher thermal conductivity (e.g., Copper) to reduce wall temperature gradients.</li>
            <li><strong>Combustion:</strong> Decrease Chamber Pressure (Pc) or alter O/F ratio to lower the flame temperature (Tc).</li>
            <li><strong>Cooling:</strong> Implement film cooling to create a protective barrier on the wall.</li>
        `;
    } else {
        alertHot.classList.add('hidden');
    }
    
    const alertBoil = document.getElementById('thermal-alert-boil');
    const recBoil = document.getElementById('thermal-rec-boil');
    if (Twc > 420) {
        alertBoil.classList.remove('hidden');
        recBoil.innerHTML = `
            <li><strong>Coolant Flow:</strong> Increase the O/F ratio to route more HTP mass flow through the cooling channels, increasing coolant velocity.</li>
            <li><strong>Thermal Barrier:</strong> Switch to a material with lower thermal conductivity (e.g., Inconel) to restrict heat flow into the coolant (Warning: This will raise Gas-Side Wall Temp).</li>
            <li><strong>Geometry:</strong> Increase the Contraction Ratio (CR) to reduce the throat heat flux severity relative to the chamber.</li>
        `;
    } else {
        alertBoil.classList.add('hidden');
    }

    drawEngineSVG(Dc, Dt, De, Lc);
    drawCoolingSVG(w_c_mm, w_t_mm, h_mm, t_rib_mm, t_w_mm);
    
    // 8. Mass Optimization Sweep (CR from 2.0 to 10.0)
    let best_mass = Infinity;
    let best_cr = 0;
    const cr_data = [];
    const mass_data = [];
    
    for (let test_cr = 2.0; test_cr <= 10.0; test_cr += 0.2) {
        const test_Dc = Math.sqrt((4 * test_cr * At) / Math.PI);
        const test_Lc = Lstar / test_cr;
        const test_tw = opt_tw_m;
        
        // 1. Converging Section (Assume 45 deg half-angle)
        const L_conv = (test_Dc - Dt) / 2;
        const S_conv = Math.sqrt(Math.pow((test_Dc - Dt)/2, 2) + Math.pow(L_conv, 2));
        const SA_conv = Math.PI * ((test_Dc + Dt) / 2) * S_conv;
        
        // 2. Diverging Section (Assume 15 deg half-angle)
        const half_angle_div = 15 * Math.PI / 180;
        const L_div = (De - Dt) / (2 * Math.tan(half_angle_div));
        const S_div = Math.sqrt(Math.pow((De - Dt)/2, 2) + Math.pow(L_div, 2));
        const SA_div = Math.PI * ((De + Dt) / 2) * S_div;
        
        // 3. Cylinder Section
        const SA_cyl = Math.PI * test_Dc * test_Lc;
        
        const SA_inner = SA_cyl + SA_conv + SA_div;
        const L_profile = test_Lc + S_conv + S_div;
        
        // 4. Inner Liner Mass
        const M_inner = SA_inner * test_tw * rho_mat;
        
        // 5. Ribs Mass
        // Recalculate approx number of channels for this CR
        const test_N_chan = Math.max(1, Math.floor( (Math.PI * Dt * 1000) / ((custom_wt ? custom_wt : 1.5) + t_rib_mm) ));
        const M_ribs = test_N_chan * (t_rib_mm / 1000) * (h_mm / 1000) * L_profile * rho_mat;
        
        // 6. Outer Jacket Mass
        const t_jacket = (Pf * test_Dc) / (2 * allow_stress_MPa * 1e6);
        const D_outer = test_Dc + 2 * (h_mm / 1000 + test_tw);
        const SA_outer = SA_inner * (D_outer / test_Dc);
        const M_jacket = SA_outer * t_jacket * rho_mat;
        
        // Total (excluding flanges/injector)
        const total_mass = M_inner + M_ribs + M_jacket;
        
        cr_data.push(test_cr.toFixed(1));
        mass_data.push(total_mass.toFixed(2));
        
        if (total_mass < best_mass) {
            best_mass = total_mass;
            best_cr = test_cr;
        }
    }
    
    document.getElementById('res-opt-cr').textContent = best_cr.toFixed(1);
    document.getElementById('res-opt-mass').textContent = best_mass.toFixed(2) + ' kg';
    
    renderMassChart(cr_data, mass_data, best_cr);
}

let massChartInstance = null;
function renderMassChart(labels, data, best_cr) {
    const ctx = document.getElementById('massChart').getContext('2d');
    
    if (massChartInstance) {
        massChartInstance.destroy();
    }
    
    const bestIndex = labels.indexOf(best_cr.toFixed(1));
    const pointColors = data.map((_, i) => i === bestIndex ? '#4ade80' : '#38bdf8');
    const pointRadii = data.map((_, i) => i === bestIndex ? 6 : 3);
    
    massChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Structural Mass (kg)',
                data: data,
                borderColor: 'rgba(56, 189, 248, 0.8)',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: pointColors,
                pointRadius: pointRadii,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Contraction Ratio (CR)', color: '#94a3b8' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    title: { display: true, text: 'Mass [kg]', color: '#94a3b8' },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

function drawCoolingSVG(wc, wt, h, t_rib, t_w) {
    const svg = document.getElementById('cooling-svg');
    svg.innerHTML = '';
    
    // Two groups: top (Chamber), bottom (Throat)
    const renderChannel = (centerY, w, title) => {
        // Calculate a dynamic scale to ensure it fits in ~340px width
        let scale = Math.min(30, 340 / (w + 2 * t_rib));
        
        let s_w = Math.max(w * scale, 80);
        let s_h = Math.max(h * scale, 60);
        let s_trib = Math.max(t_rib * scale, 40);
        let s_tw = Math.max(t_w * scale, 25);
        
        let totalW = s_trib*2 + s_w;
        
        // Final safety check to prevent any overflow due to Math.max bounds
        if (totalW > 380) {
            const shrink = 380 / totalW;
            s_w *= shrink;
            s_trib *= shrink;
            s_h *= shrink;
            s_tw *= shrink;
            totalW = 380;
        }
        
        const xOffset = (400 - totalW) / 2;
        const yOffset = centerY - (s_h + s_tw + 30) / 2;
        
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("transform", `translate(${xOffset}, ${yOffset})`);
        
        // 1. Hot Gas Area (bottom)
        const hotGas = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        hotGas.setAttribute("x", "0");
        hotGas.setAttribute("y", s_tw + s_h + 10);
        hotGas.setAttribute("width", s_trib*2 + s_w);
        hotGas.setAttribute("height", 20);
        hotGas.setAttribute("fill", "rgba(239, 68, 68, 0.15)");
        g.appendChild(hotGas);

        const hotGasText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        hotGasText.setAttribute("x", (s_trib*2 + s_w)/2);
        hotGasText.setAttribute("y", s_tw + s_h + 24);
        hotGasText.setAttribute("fill", "var(--danger)");
        hotGasText.setAttribute("font-size", "10");
        hotGasText.setAttribute("font-weight", "bold");
        hotGasText.setAttribute("text-anchor", "middle");
        hotGasText.textContent = "HOT GAS FLOW";
        g.appendChild(hotGasText);

        // 2. Outer Jacket (top)
        const jacket = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        jacket.setAttribute("x", "0");
        jacket.setAttribute("y", "-10");
        jacket.setAttribute("width", s_trib*2 + s_w);
        jacket.setAttribute("height", 10);
        jacket.setAttribute("fill", "#475569");
        g.appendChild(jacket);

        // 3. Metal Liner (Inner wall + Ribs)
        const liner = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const d = `M0,${s_tw+s_h} L${s_trib*2+s_w},${s_tw+s_h} L${s_trib*2+s_w},${s_h} L${s_trib+s_w},${s_h} L${s_trib+s_w},0 L${s_trib},0 L${s_trib},${s_h} L0,${s_h} Z`;
        liner.setAttribute("d", d);
        liner.setAttribute("fill", "#94a3b8");
        g.appendChild(liner);

        // 4. Coolant Fluid
        const coolant = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        coolant.setAttribute("x", s_trib);
        coolant.setAttribute("y", "0");
        coolant.setAttribute("width", s_w);
        coolant.setAttribute("height", s_h);
        coolant.setAttribute("fill", "rgba(56, 189, 248, 0.4)");
        g.appendChild(coolant);

        // Helper to draw dimension lines
        const addDim = (x1, y1, x2, y2, label, labelX, labelY, align) => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", x1); line.setAttribute("y1", y1);
            line.setAttribute("x2", x2); line.setAttribute("y2", y2);
            line.setAttribute("stroke", "white"); line.setAttribute("stroke-width", "1.5");
            g.appendChild(line);
            
            // Ticks
            const tickSize = 4;
            if (x1 !== x2) {
                const t1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
                t1.setAttribute("x1", x1); t1.setAttribute("y1", y1-tickSize); t1.setAttribute("x2", x1); t1.setAttribute("y2", y1+tickSize);
                t1.setAttribute("stroke", "white"); t1.setAttribute("stroke-width", "1.5");
                g.appendChild(t1);
                
                const t2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
                t2.setAttribute("x1", x2); t2.setAttribute("y1", y2-tickSize); t2.setAttribute("x2", x2); t2.setAttribute("y2", y2+tickSize);
                t2.setAttribute("stroke", "white"); t2.setAttribute("stroke-width", "1.5");
                g.appendChild(t2);
            } else {
                const t1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
                t1.setAttribute("x1", x1-tickSize); t1.setAttribute("y1", y1); t1.setAttribute("x2", x1+tickSize); t1.setAttribute("y2", y1);
                t1.setAttribute("stroke", "white"); t1.setAttribute("stroke-width", "1.5");
                g.appendChild(t1);
                
                const t2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
                t2.setAttribute("x1", x2-tickSize); t2.setAttribute("y1", y2); t2.setAttribute("x2", x2+tickSize); t2.setAttribute("y2", y2);
                t2.setAttribute("stroke", "white"); t2.setAttribute("stroke-width", "1.5");
                g.appendChild(t2);
            }

            const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
            txt.setAttribute("x", labelX); txt.setAttribute("y", labelY);
            txt.setAttribute("fill", "white"); txt.setAttribute("font-size", "12");
            txt.setAttribute("text-anchor", align);
            txt.textContent = label;
            g.appendChild(txt);
        };

        // Dimensions
        addDim(s_trib, s_h/2, s_trib+s_w, s_h/2, "W: " + w.toFixed(1), s_trib + s_w/2, s_h/2 - 5, "middle");
        addDim(0, s_h/2, s_trib, s_h/2, "Rib: " + t_rib.toFixed(1), s_trib/2, s_h/2 - 5, "middle");
        addDim(s_trib+s_w+10, 0, s_trib+s_w+10, s_h, "H: " + h.toFixed(1), s_trib+s_w+15, s_h/2 + 4, "start");
        addDim(s_trib*1.5 + s_w, s_h, s_trib*1.5 + s_w, s_h+s_tw, "tw: " + t_w.toFixed(2), s_trib*1.5 + s_w + 5, s_h + s_tw/2 + 4, "start");

        // Title
        const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        titleText.setAttribute("x", (s_trib*2 + s_w)/2);
        titleText.setAttribute("y", "-25");
        titleText.setAttribute("fill", "var(--text-secondary)");
        titleText.setAttribute("font-family", "Outfit");
        titleText.setAttribute("font-size", "16");
        titleText.setAttribute("text-anchor", "middle");
        titleText.textContent = title;
        g.appendChild(titleText);
        
        return g;
    };
    
    svg.appendChild(renderChannel(110, wc, "Chamber Section"));
    svg.appendChild(renderChannel(330, wt, "Throat Section"));
}

function drawEngineSVG(Dc, Dt, De, Lc) {
    const svg = document.getElementById('engine-svg');
    // We normalize dimensions to fit the 500x200 canvas
    // Let's establish a scale based on max length or max diameter
    const L_nozzle = Lc * 0.8; // Approximate diverging section length for drawing
    const L_total = Lc + L_nozzle;
    const D_max = Math.max(Dc, De);
    
    const padding = 20;
    const scaleX = (500 - padding * 2) / L_total;
    const scaleY = (200 - padding * 2) / D_max;
    // Use the smaller scale to maintain aspect ratio
    const scale = Math.min(scaleX, scaleY); 
    
    const centerX = padding;
    const centerY = 100;

    // Scaled values
    const s_Lc = Lc * scale;
    const s_Ln = L_nozzle * scale;
    const s_R_c = (Dc / 2) * scale;
    const s_R_t = (Dt / 2) * scale;
    const s_R_e = (De / 2) * scale;

    // SVG Path construction
    // Start at injector face top
    const p1 = `${centerX},${centerY - s_R_c}`; 
    // Chamber straight section (assume 70% of Lc is straight, 30% converging)
    const Lc_straight = s_Lc * 0.7;
    const p2 = `${centerX + Lc_straight},${centerY - s_R_c}`;
    // Throat
    const p3 = `${centerX + s_Lc},${centerY - s_R_t}`;
    // Nozzle exit
    const p4 = `${centerX + s_Lc + s_Ln},${centerY - s_R_e}`;
    // Bottom side (symmetric)
    const p5 = `${centerX + s_Lc + s_Ln},${centerY + s_R_e}`;
    const p6 = `${centerX + s_Lc},${centerY + s_R_t}`;
    const p7 = `${centerX + Lc_straight},${centerY + s_R_c}`;
    const p8 = `${centerX},${centerY + s_R_c}`;

    const pathD = `M ${p1} L ${p2} C ${centerX + s_Lc - 10},${centerY - s_R_c} ${centerX + s_Lc - 10},${centerY - s_R_t} ${p3} C ${centerX + s_Lc + 20},${centerY - s_R_t} ${centerX + s_Lc + s_Ln - 20},${centerY - s_R_e} ${p4} L ${p5} C ${centerX + s_Lc + s_Ln - 20},${centerY + s_R_e} ${centerX + s_Lc + 20},${centerY + s_R_t} ${p6} C ${centerX + s_Lc - 10},${centerY + s_R_t} ${centerX + s_Lc - 10},${centerY + s_R_c} ${p7} L ${p8} Z`;

    svg.innerHTML = `
        <path d="${pathD}" fill="none" stroke="var(--accent-color)" stroke-width="3" />
        
        <!-- Center Line -->
        <line x1="${centerX}" y1="${centerY}" x2="${centerX + s_Lc + s_Ln}" y2="${centerY}" stroke="rgba(255,255,255,0.2)" stroke-dasharray="5,5" />
        
        <!-- Labels -->
        <text x="${centerX + Lc_straight/2}" y="${centerY - s_R_c - 10}" fill="var(--text-secondary)" font-size="12" text-anchor="middle">Dc: ${(Dc*100).toFixed(1)}cm</text>
        <text x="${centerX + s_Lc}" y="${centerY - s_R_t - 10}" fill="var(--accent-color)" font-size="12" font-weight="bold" text-anchor="middle">Dt: ${(Dt*100).toFixed(1)}cm</text>
        <text x="${centerX + s_Lc + s_Ln}" y="${centerY - s_R_e - 10}" fill="var(--text-secondary)" font-size="12" text-anchor="end">De: ${(De*100).toFixed(1)}cm</text>
        
        <!-- Injector Face -->
        <line x1="${centerX}" y1="${centerY - s_R_c}" x2="${centerX}" y2="${centerY + s_R_c}" stroke="var(--success)" stroke-width="4" />
        <text x="${centerX - 10}" y="${centerY}" fill="var(--success)" font-size="12" transform="rotate(-90 ${centerX - 10} ${centerY})" text-anchor="middle">Injector Face</text>
    `;
}

document.getElementById('sizing-form').addEventListener('submit', function(e) {
    e.preventDefault();
    calculateSizing();
});

// Material Preset Listener
const materialPreset = document.getElementById('material_preset');
if (materialPreset) {
    materialPreset.addEventListener('change', function(e) {
        const stressInput = document.getElementById('allow_stress');
        const kwInput = document.getElementById('kw');
        if (e.target.value === 'copper') {
            stressInput.value = 150;
            kwInput.value = 350;
        } else if (e.target.value === 'inconel') {
            stressInput.value = 600;
            kwInput.value = 15;
        } else if (e.target.value === 'ss') {
            stressInput.value = 200;
            kwInput.value = 16;
        }
    });
}

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    calculateStability();
    loadExperimentalData();
});
