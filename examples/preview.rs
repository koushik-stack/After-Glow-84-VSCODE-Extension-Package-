#[derive(Debug)]
struct Horizon { name: &'static str, glow: u8 }

fn main() {
    // Lifetimes, macros, types, and member access.
    let sky = Horizon { name: "Afterglow", glow: 84 };
    if sky.glow > 0 { println!("{}: {:?}", sky.name, sky); }
}
