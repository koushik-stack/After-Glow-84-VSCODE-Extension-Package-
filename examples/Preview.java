record Horizon(String name, int glow) {
    // Types, methods, variables, strings, and control flow.
    public static void main(String[] args) {
        var sky = new Horizon("Afterglow", 84);
        if (sky.glow() > 0) System.out.println(sky.name());
    }
}
